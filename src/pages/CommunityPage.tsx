import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Flag,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import {
  addPostComment,
  checkPostLiked,
  createCommunityPost,
  deleteCommunityPost,
  formatTimestamp,
  subscribePostComments,
  toggleLikePost,
  toggleSaveItem,
} from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  CommunityPost,
  POST_CATEGORIES,
  PostCategory,
  PostComment,
} from '../types/nritya';
import { SafeImage } from '../components/SafeImage';
import { ReportModal } from '../components/ReportModal';

const MEDIA_PRESETS = [
  { label: 'None', url: '' },
  { label: 'Temple Courtyard Study', url: NRITYA_IMAGES.hero },
  { label: 'Kathak Studio & Tabla', url: NRITYA_IMAGES.masterclass },
  { label: 'Sabha Stage & Lamps', url: NRITYA_IMAGES.eventStage },
  { label: 'Tanpura & Notation Study', url: NRITYA_IMAGES.gatheringStudy },
];

const PostCard: React.FC<{
  post: CommunityPost;
  onReport: (p: CommunityPost) => void;
}> = ({ post, onReport }) => {
  const {
    currentUserProfile,
    isAdmin,
    savedItems,
    setOpenAuthModal,
    setSelectedDancerUid,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);

  const isSaved = savedItems.some(
    (item) => item.itemType === 'post' && item.itemId === post.id
  );
  const isAuthor = currentUserProfile?.uid === post.authorId;

  useEffect(() => {
    if (!currentUserProfile || usingPreviewFallback) {
      setLiked(false);
      return;
    }
    checkPostLiked(post.id, currentUserProfile.uid)
      .then(setLiked)
      .catch(() => setLiked(false));
  }, [post.id, currentUserProfile, usingPreviewFallback]);

  useEffect(() => {
    if (!showComments || usingPreviewFallback) return;
    const unsub = subscribePostComments(post.id, setComments);
    return () => unsub();
  }, [post.id, showComments, usingPreviewFallback]);

  const handleLike = async () => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (usingPreviewFallback) {
      showToast('Sign in as Administrator to publish sample catalog to Firestore.', 'info');
      return;
    }
    setBusy(true);
    try {
      await toggleLikePost(post.id, currentUserProfile.uid, liked);
      setLiked((prev) => !prev);
    } catch (err: any) {
      showToast(err?.message || 'Unable to update like.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (usingPreviewFallback) {
      showToast('Sample preview item cannot be saved until seeded.', 'info');
      return;
    }
    try {
      await toggleSaveItem({
        uid: currentUserProfile.uid,
        itemType: 'post',
        itemId: post.id,
        title: post.title,
        subtitle: post.authorName,
        danceForm: post.danceForm,
        currentlySaved: isSaved,
      });
      showToast(isSaved ? 'Removed from saved items.' : 'Saved to your dashboard.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to save item.', 'error');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (usingPreviewFallback) {
      showToast('Sample preview comments require live database seeding.', 'info');
      return;
    }
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await addPostComment({
        postId: post.id,
        author: currentUserProfile,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (err: any) {
      showToast(err?.message || 'Could not post comment.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor && !isAdmin) return;
    try {
      await deleteCommunityPost(post.id);
      showToast('Post deleted.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Unable to delete post.', 'error');
    }
  };

  return (
    <article className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedDancerUid(post.authorId)}
              className="w-11 h-11 rounded-xl overflow-hidden border border-[#E5DDD2] shrink-0"
            >
              <SafeImage
                src={post.authorPhoto}
                alt={post.authorName}
                fallbackTitle={post.authorName}
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDancerUid(post.authorId)}
                  className="font-medium text-sm text-[#1E171D] hover:text-[#4A1D3D] truncate"
                >
                  {post.authorName}
                </button>
                {post.authorVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B38838] shrink-0" />
                )}
              </div>
              <p className="text-xs text-[#5A4A57]">
                <span className="capitalize">{post.authorRole}</span> · {post.danceForm} ·{' '}
                {post.category} · {formatTimestamp(post.createdAt)}
                {post.isSample && (
                  <span className="text-[#B5727B] ml-1.5">· Sample Post</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(isAuthor || isAdmin) && !usingPreviewFallback && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete post"
                className="p-2 rounded-lg text-[#5A4A57] hover:text-[#B5727B] hover:bg-[#F3EDE3]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onReport(post)}
              aria-label="Report post"
              className="p-2 rounded-lg text-[#5A4A57] hover:text-[#B5727B] hover:bg-[#F3EDE3]"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold text-[#1E171D] leading-snug">
            {post.title}
          </h3>
          <p className="text-sm text-[#1E171D]/90 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {post.mediaUrl && (
          <div className="space-y-1.5">
            <div className="h-64 sm:h-80 rounded-lg overflow-hidden border border-[#E5DDD2]">
              <SafeImage
                src={post.mediaUrl}
                alt={post.mediaCaption || post.title}
                fallbackTitle={post.danceForm}
              />
            </div>
            {post.mediaCaption && (
              <p className="text-xs text-[#5A4A57] italic">{post.mediaCaption}</p>
            )}
          </div>
        )}

        {/* Action Strip */}
        <div className="pt-3 border-t border-[#E5DDD2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors tabular-nums ${
                liked
                  ? 'text-[#4A1D3D] bg-[#4A1D3D]/10'
                  : 'text-[#5A4A57] hover:text-[#4A1D3D] hover:bg-[#F3EDE3]'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[#4A1D3D]' : ''}`} />
              {post.likesCount} Likes
            </button>

            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A4A57] hover:text-[#4A1D3D] py-1.5 px-2.5 rounded-md hover:bg-[#F3EDE3] tabular-nums"
            >
              <MessageSquare className="w-4 h-4" />
              {post.commentsCount} Comments
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors ${
              isSaved
                ? 'text-[#4A1D3D] bg-[#4A1D3D]/10'
                : 'text-[#5A4A57] hover:text-[#4A1D3D] hover:bg-[#F3EDE3]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#4A1D3D]' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Comments Drawer */}
        {showComments && (
          <div className="pt-4 border-t border-[#E5DDD2] space-y-4">
            {comments.length === 0 ? (
              <p className="text-xs text-[#5A4A57]">
                No comments yet. Share a respectful reflection or encouragement.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedDancerUid(c.authorId)}
                        className="font-semibold text-[#4A1D3D] hover:underline"
                      >
                        {c.authorName}
                      </button>
                      <span className="text-[#5A4A57]">{formatTimestamp(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#1E171D]">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                maxLength={1000}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  currentUserProfile ? 'Add a supportive comment...' : 'Sign in to comment...'
                }
                className="flex-1 px-3.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
              />
              <button
                type="submit"
                disabled={busy || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

export const CommunityPage: React.FC = () => {
  const {
    posts,
    currentUserProfile,
    privateAccount,
    setOpenAuthModal,
    showToast,
  } = useNritya();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | PostCategory>('All');
  const [reportTarget, setReportTarget] = useState<{
    type: 'post';
    id: string;
    title: string;
  } | null>(null);

  // Composer state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('Dance Journey');
  const [danceForm, setDanceForm] = useState<string>(
    currentUserProfile?.danceForms[0] || 'Bharatanatyam'
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const blockedIds = privateAccount?.blockedUserIds || [];

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      if (blockedIds.includes(p.authorId)) return false;
      if (selectedForm !== 'All' && p.danceForm !== selectedForm) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.content.toLowerCase().includes(q) &&
        !p.authorName.toLowerCase().includes(q) &&
        !p.danceForm.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [posts, blockedIds, selectedForm, selectedCategory, searchTerm]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (title.trim().length < 3 || content.trim().length < 10) {
      showToast('Please provide a title (3+ chars) and reflection (10+ chars).', 'error');
      return;
    }
    setPosting(true);
    try {
      await createCommunityPost({
        author: currentUserProfile,
        title: title.trim(),
        content: content.trim(),
        category,
        danceForm,
        mediaUrl: mediaUrl.trim(),
        mediaCaption: mediaCaption.trim(),
      });
      setTitle('');
      setContent('');
      setMediaUrl('');
      setMediaCaption('');
      showToast('Your community post has been published.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to publish post.', 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-2 border-b border-[#E5DDD2] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B5727B]">
          Dancer Community
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
          Stories, Practice Notes & Classical Dialogue
        </h1>
        <p className="text-sm text-[#5A4A57] max-w-2xl">
          Share your dance milestones, abhinaya inquiries, and studio reflections in a
          moderated, privacy-conscious space.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Composer + Filters */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Share With the Community
            </h2>
            {!currentUserProfile ? (
              <div className="space-y-3">
                <p className="text-sm text-[#5A4A57]">
                  Sign in and complete your cultural profile to publish reflections, like,
                  comment, or bookmark posts.
                </p>
                <button
                  type="button"
                  onClick={() => setOpenAuthModal(true)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
                >
                  Sign In to Post
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={160}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Preparing my first Varnam jathi..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PostCategory)}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                    >
                      {POST_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                      Dance Form
                    </label>
                    <select
                      value={danceForm}
                      onChange={(e) => setDanceForm(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                    >
                      {CLASSICAL_DANCE_FORMS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                    Reflection or Question
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    maxLength={3000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, practice insight, or question..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Permitted Visual Attachment
                    </span>
                  </label>
                  <select
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                  >
                    {MEDIA_PRESETS.map((m) => (
                      <option key={m.label} value={m.url}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {mediaUrl && (
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                      Image Caption
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Brief caption..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={posting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60 min-h-[44px]"
                >
                  {posting ? 'Publishing...' : 'Publish to Community'}
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* Right Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Filters */}
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5A4A57] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts by topic, dancer, or style..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
                />
              </div>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                aria-label="Filter by dance form"
                className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              >
                <option value="All">All Dance Forms</option>
                {CLASSICAL_DANCE_FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['All', ...POST_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                      : 'bg-[#FAF7F2] text-[#5A4A57] hover:text-[#1E171D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-10 text-center space-y-2">
              <p className="font-display text-2xl font-semibold text-[#1E171D]">
                No matching posts found
              </p>
              <p className="text-sm text-[#5A4A57]">
                Try clearing your filters or start a new conversation in the composer.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReport={(p) =>
                    setReportTarget({ type: 'post', id: p.id, title: p.title })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
};
