import React, { useState, useMemo } from 'react';
import { Project } from '../types/index.ts';
import { VideoModal } from './VideoModal.tsx';
import { Film, Play, Star, Calendar, Filter } from 'lucide-react';

interface OurWorksSectionProps {
  projects: Project[];
}

export const OurWorksSection: React.FC<OurWorksSectionProps> = ({ projects }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) {
        // Handle comma or slash separated
        p.category.split(/[/,]/).forEach((cat) => {
          const trimmed = cat.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (!proj.isPublished) return false;
      if (selectedCategory === 'ALL') return true;
      return proj.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [projects, selectedCategory]);

  return (
    <section id="projects" className="py-24 sm:py-32 bg-[#09090d] relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Production</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-wide uppercase mb-4">
            OUR WORKS
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
          <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            Discover BlackBird Studio’s completed anime dubbing projects localized into authentic Bangla voice acting.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            All Works ({projects.filter((p) => p.isPublished).length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-heading font-semibold text-zinc-300 mb-1">
              No Dubbing Projects in this Category
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Select "All Works" to view all available releases.
            </p>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-amber-300 font-semibold hover:bg-zinc-700 transition-colors"
            >
              Show All Works
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setActiveProject(project)}
                className="group relative rounded-2xl bg-[#0f0f14] border border-zinc-800/80 hover:border-amber-500/50 overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.18)] cursor-pointer flex flex-col"
              >
                {/* Thumbnail Banner */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f14] via-black/30 to-black/30" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:scale-110 group-hover:bg-amber-400 active:scale-95 transition-all">
                      <Play className="w-6 h-6 fill-black translate-x-0.5" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      {project.animeName}
                    </span>

                    {project.isFeatured && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-[10px] uppercase tracking-wider shadow-md">
                        <Star className="w-3 h-3 fill-black" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Episode Number Tag */}
                  {project.episodeNumber && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-700 text-white text-xs font-semibold">
                        {project.episodeNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed font-light">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {project.releaseDate}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                      {project.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Video Modal Player */}
      <VideoModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </section>
  );
};
