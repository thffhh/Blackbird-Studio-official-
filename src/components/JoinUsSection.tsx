import React, { useState } from 'react';
import { Rank, OFFICIAL_RANKS } from '../types/index.ts';
import { submitApplication, uploadMedia } from '../services/api.ts';
import { getRankBadgeStyle } from '../utils/ranks.ts';
import { 
  UserPlus, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  ShieldAlert, 
  Info,
  Loader2
} from 'lucide-react';

interface JoinUsSectionProps {
  onOpenTrackApp: () => void;
}

export const JoinUsSection: React.FC<JoinUsSectionProps> = ({ onOpenTrackApp }) => {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [desiredRank, setDesiredRank] = useState<Rank>('D');
  const [hobbies, setHobbies] = useState('');
  const [bio, setBio] = useState('');
  const [motivation, setMotivation] = useState('');
  const [dubbingExperience, setDubbingExperience] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<{ id: string; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatarUrl: 'Image size must be under 8MB.' }));
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      const res = await uploadMedia(file);
      setAvatarUrl(res.url);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.avatarUrl;
        return copy;
      });
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, avatarUrl: err.message || 'Image upload failed' }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name is required (minimum 2 characters).';
    }
    if (!avatarUrl && !avatarPreview) {
      newErrors.avatarUrl = 'Please upload a clear profile picture.';
    }
    if (!hobbies.trim() || hobbies.trim().length < 2) {
      newErrors.hobbies = 'Please list at least one hobby or creative interest.';
    }
    if (!bio.trim() || bio.trim().length < 10) {
      newErrors.bio = 'Please provide a short introduction or bio (minimum 10 characters).';
    }
    if (!motivation.trim() || motivation.trim().length < 15) {
      newErrors.motivation = 'Please share your motivation for joining BlackBird Studio (minimum 15 characters).';
    }
    if (!contactInfo.trim()) {
      newErrors.contactInfo = 'Facebook profile link or email is required.';
    }
    if (!isConfirmed) {
      newErrors.isConfirmed = 'You must confirm that the submitted information is accurate.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitApplication({
        fullName,
        avatarUrl: avatarUrl || avatarPreview,
        desiredRank,
        hobbies,
        bio,
        motivation,
        dubbingExperience,
        contactInfo,
        additionalInfo,
        isConfirmed
      });

      setSubmissionResult({
        id: res.applicationId,
        message: res.message
      });

      // Clear form
      setFullName('');
      setAvatarUrl('');
      setAvatarPreview('');
      setDesiredRank('D');
      setHobbies('');
      setBio('');
      setMotivation('');
      setDubbingExperience('');
      setContactInfo('');
      setAdditionalInfo('');
      setIsConfirmed(false);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submissionResult) return;
    navigator.clipboard.writeText(submissionResult.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <section id="join-us" className="py-24 sm:py-32 bg-[#08080a] relative border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Auditions & Recruitment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-wide uppercase mb-4">
            Join BlackBird Studio
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
          <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            Ready to give voice to legendary anime characters in Bangla? Submit your application to our casting committee.
          </p>
        </div>

        {/* Studio Policy Reminder Note */}
        <div className="mb-10 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-zinc-300">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 block mb-0.5">Audition Submission Policy:</span>
            <span>
              Per official BlackBird Studio regulations, <strong>no audio file or voice recording upload is required</strong> in this application. After our directors review your written profile, shortlisted applicants will be contacted directly for a scheduled live voice audition.
            </span>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-[#0f0f14] border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-[0_0_40px_rgba(212,175,55,0.12)]">
          {errors.form && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Field 1 & 2: Full Name & Profile Picture Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              
              {/* Profile Picture Upload (Field 2) */}
              <div className="sm:col-span-4 flex flex-col items-center">
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block self-start">
                  2. Profile Picture *
                </label>
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/40 bg-zinc-900 flex flex-col items-center justify-center group hover:border-amber-400 transition-colors cursor-pointer shadow-inner">
                  {avatarPreview || avatarUrl ? (
                    <img 
                      src={avatarPreview || avatarUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                      <span className="text-[11px] text-zinc-400 leading-tight block">
                        Upload Photo (JPG/PNG)
                      </span>
                    </div>
                  )}

                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload profile picture"
                  />
                </div>
                {errors.avatarUrl && (
                  <span className="text-xs text-rose-400 mt-1.5 text-center">{errors.avatarUrl}</span>
                )}
                <span className="text-[11px] text-zinc-500 mt-1.5 text-center">
                  Square ratio recommended
                </span>
              </div>

              {/* Full Name & Desired Rank (Fields 1 & 3) */}
              <div className="sm:col-span-8 space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                    1. Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed Chowdhury"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  {errors.fullName && <span className="text-xs text-rose-400 mt-1 block">{errors.fullName}</span>}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                    3. Desired Rank / Target Rank *
                  </label>
                  <select
                    value={desiredRank}
                    onChange={(e) => setDesiredRank(e.target.value as Rank)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                  >
                    {OFFICIAL_RANKS.map((rank) => (
                      <option key={rank} value={rank}>
                        Rank {rank} — {getRankBadgeStyle(rank).description}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    New applicants are typically auditioned for Trainee (D) to established ranks (C, B, A).
                  </span>
                </div>
              </div>

            </div>

            {/* Field 4: Hobbies */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                4. Hobbies & Creative Interests *
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g. Voice modulation, anime watching, script writing, audio mastering"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              {errors.hobbies && <span className="text-xs text-rose-400 mt-1 block">{errors.hobbies}</span>}
            </div>

            {/* Field 5: Short Introduction / Bio */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                5. Short Introduction / Bio *
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little bit about yourself, your background, and your vocal personality..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
              {errors.bio && <span className="text-xs text-rose-400 mt-1 block">{errors.bio}</span>}
            </div>

            {/* Field 6: Why do you want to join BlackBird Studio? */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                6. Why do you want to join BlackBird Studio? *
              </label>
              <textarea
                rows={3}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="What draws you to BlackBird Studio specifically? Which characters or anime genres do you want to dub?"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
              {errors.motivation && <span className="text-xs text-rose-400 mt-1 block">{errors.motivation}</span>}
            </div>

            {/* Field 7: Dubbing Experience (Optional) */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                7. Dubbing / Voice Acting Experience <span className="text-zinc-400 lowercase font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={dubbingExperience}
                onChange={(e) => setDubbingExperience(e.target.value)}
                placeholder="Mention any past fandubs, theater, radio, YouTube projects, or vocal training..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            {/* Field 8: Contact Information */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                8. Contact Information (Facebook profile link or Email) *
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. facebook.com/your.username or you@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              {errors.contactInfo && <span className="text-xs text-rose-400 mt-1 block">{errors.contactInfo}</span>}
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Our directors will use this link to contact you for the audition invitation.
              </span>
            </div>

            {/* Field 9: Additional Information (Optional) */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-2 block">
                9. Additional Information <span className="text-zinc-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="e.g. Available recording equipment, weekly availability hours, languages known"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Field 10: Confirmation Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/40 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white transition-colors">
                  10. I solemnly confirm that the submitted information is accurate and true to the best of my knowledge. *
                </span>
              </label>
              {errors.isConfirmed && (
                <span className="text-xs text-rose-400 mt-1.5 block">{errors.isConfirmed}</span>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Submit Audition Application</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenTrackApp}
                className="text-xs text-zinc-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
              >
                Already submitted? Track your Application Status &rarr;
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Submission Success Modal */}
      {submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0f0f14] border border-amber-500/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-heading font-black text-white uppercase tracking-wide mb-2">
              Application Submitted!
            </h3>
            
            <p className="text-sm text-zinc-300 mb-6 font-light">
              Your application to BlackBird Studio has been saved successfully in our system with status <span className="text-amber-400 font-semibold uppercase">Pending</span>.
            </p>

            {/* Application ID Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 mb-6 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Your Unique Application ID</span>
                <span className="text-lg font-mono font-bold text-amber-300">{submissionResult.id}</span>
              </div>
              <button
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500 hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-6">
              Keep this ID safe! You can use it anytime with our tracker to check your review status.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  onOpenTrackApp();
                }}
                className="px-6 py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer"
              >
                Track Status Now
              </button>
              <button
                onClick={() => setSubmissionResult(null)}
                className="px-6 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 font-semibold text-xs uppercase tracking-wider hover:bg-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
