import React, { useState } from 'react';
import { Project } from '../../../types/index.ts';
import { uploadMedia } from '../../../services/api.ts';
import { 
  Film, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Star, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Check, 
  X, 
  Loader2,
  Calendar,
  Tag
} from 'lucide-react';

interface WorksManagementAdminProps {
  projects: Project[];
  onSaveProject: (project: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProjects: (orderedIds: string[]) => Promise<void>;
}

export const WorksManagementAdmin: React.FC<WorksManagementAdminProps> = ({
  projects,
  onSaveProject,
  onDeleteProject,
  onReorderProjects
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [animeName, setAnimeName] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'upload' | 'youtube' | 'external'>('upload');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setId(undefined);
    setTitle('');
    setAnimeName('');
    setEpisodeNumber('Episode 01');
    setDescription('');
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setCategory('Action / Fantasy');
    setThumbnailUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
    setVideoUrl('');
    setVideoType('youtube');
    setIsFeatured(false);
    setIsPublished(true);
    setFormError('');
    setIsEditing(true);
  };

  const handleOpenEdit = (p: Project) => {
    setId(p.id);
    setTitle(p.title);
    setAnimeName(p.animeName);
    setEpisodeNumber(p.episodeNumber);
    setDescription(p.description);
    setReleaseDate(p.releaseDate);
    setCategory(p.category);
    setThumbnailUrl(p.thumbnailUrl);
    setVideoUrl(p.videoUrl);
    setVideoType(p.videoType);
    setIsFeatured(p.isFeatured);
    setIsPublished(p.isPublished);
    setFormError('');
    setIsEditing(true);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumb(true);
      const res = await uploadMedia(file);
      setThumbnailUrl(res.url);
    } catch (err: any) {
      setFormError(err.message || 'Thumbnail upload failed');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 100MB
    if (file.size > 100 * 1024 * 1024) {
      setFormError('Video file exceeds 100MB maximum upload limit.');
      return;
    }

    try {
      setUploadingVideo(true);
      const res = await uploadMedia(file);
      setVideoUrl(res.url);
      setVideoType('upload');
    } catch (err: any) {
      setFormError(err.message || 'Video file upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !animeName.trim()) {
      setFormError('Project title and Anime name are required.');
      return;
    }

    try {
      setLoading(true);
      await onSaveProject({
        id,
        title: title.trim(),
        animeName: animeName.trim(),
        episodeNumber: episodeNumber.trim(),
        description: description.trim(),
        releaseDate,
        category: category.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        videoUrl: videoUrl.trim(),
        videoType,
        isFeatured,
        isPublished
      });
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save dubbing project.');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    const list = [...projects];
    const [item] = list.splice(index, 1);
    list.splice(targetIdx, 0, item);

    try {
      await onReorderProjects(list.map((p) => p.id));
    } catch (err: any) {
      alert(err.message || 'Failed to reorder projects');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Our Works & Video Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Upload dubbed episodes, configure thumbnails, embed YouTube releases, feature projects, and toggle published status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dub Release</span>
        </button>
      </div>

      {/* Projects List Table */}
      <div className="rounded-2xl bg-[#101015] border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Release Title</th>
                <th className="py-3 px-4">Anime & Ep</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {projects.map((proj, idx) => (
                <tr key={proj.id} className="hover:bg-zinc-900/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-zinc-400 font-bold mr-1">#{proj.displayOrder}</span>
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === projects.length - 1}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-14 h-9 rounded-lg object-cover border border-amber-500/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate max-w-xs">{proj.title}</div>
                      <div className="text-[10px] text-zinc-400">{proj.releaseDate}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-amber-300">{proj.animeName}</div>
                    <div className="text-[11px] text-zinc-400">{proj.episodeNumber}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    {proj.category}
                  </td>
                  <td className="py-3 px-4">
                    {proj.isFeatured ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase">
                        <Star className="w-3 h-3 fill-amber-400" />
                        Featured
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      proj.isPublished
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {proj.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                      title="Edit project details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(proj.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#121218] border border-rose-500/50 rounded-2xl p-6 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-heading font-bold text-white mb-2">Delete Release?</h3>
            <p className="text-xs text-zinc-400 mb-6">
              This will remove this dub project and its video from the public catalog.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteProject(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0f0f14] border border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <h3 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                {id ? 'Edit Dub Project' : 'Add New Dub Project'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="overflow-y-auto space-y-5 pr-2">
              
              {/* Title & Anime Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Project Release Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Jujutsu Kaisen S2 - Ep 01 Bangla Dub"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Anime Name (Original) *
                  </label>
                  <input
                    type="text"
                    value={animeName}
                    onChange={(e) => setAnimeName(e.target.value)}
                    required
                    placeholder="e.g. Jujutsu Kaisen"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Episode Number, Category & Release Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Episode Tag / Number
                  </label>
                  <input
                    type="text"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    placeholder="e.g. Episode 01 or Final Special"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Genre / Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Action / Supernatural"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 block">
                  Project Video Thumbnail
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0">
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Thumbnail Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Or paste thumbnail image URL"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Video Source: Upload or YouTube */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                    Dub Video Source (MP4, WebM, MOV or YouTube Link)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoType('upload')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        videoType === 'upload' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoType('youtube')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        videoType === 'youtube' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      YouTube Embed
                    </button>
                  </div>
                </div>

                {videoType === 'upload' ? (
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-semibold cursor-pointer border border-zinc-700">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingVideo ? 'Uploading Video File...' : 'Choose MP4 / WebM / MOV Video'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadingVideo && (
                      <div className="text-xs text-amber-400 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading video to persistent storage...</span>
                      </div>
                    )}
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="/uploads/your-video.mp4"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Supports direct YouTube video links (e.g. youtube.com/watch?v=... or youtu.be/...)
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
                  Dubbing Release Description & Voice Cast Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the episode, localized scene details, voice director notes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
                />
              </div>

              {/* Toggles: Featured & Published */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500"
                  />
                  <span className="text-xs text-zinc-200">
                    Feature on Homepage Showcase
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500"
                  />
                  <span className="text-xs text-zinc-200">
                    Published (Visible in Public Video Gallery)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Release</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
