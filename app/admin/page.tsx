'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lock, Edit, Trash2, Plus, LogOut } from 'lucide-react';
import type { NewsPost } from '@/lib/news';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [news, setNews] = useState<NewsPost[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [creating, setCreating] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingNews, setLoadingNews] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Programs',
    publishDate: new Date().toISOString().split('T')[0],
  });

  const loadNews = async () => {
    try {
      setLoadingNews(true);
      const response = await fetch('/api/news', { cache: 'no-store' });
      const data = await response.json();

      if (response.ok) {
        setNews(data);
      } else {
        console.error(data.error || 'Failed to load news');
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadNews();
    }
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoggingIn(true);

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || 'Login failed');
        return;
      }

      setAuthenticated(true);
      setPasswordError('');
    } catch (error) {
      console.error(error);
      setPasswordError('Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Programs',
      publishDate: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);

      const data = new FormData();
      data.append('adminPassword', password);
      data.append('title', formData.title);
      data.append('excerpt', formData.excerpt);
      data.append('content', formData.content);
      data.append('category', formData.category);
      data.append('publishDate', formData.publishDate);

      if (imageFile) {
        data.append('image', imageFile);
      }

      const url = editingId ? `/api/news/${editingId}` : '/api/news';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: data });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Failed to save');
        return;
      }

      await loadNews();
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      alert('Something went wrong while saving the post.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Failed to delete');
        return;
      }

      await loadNews();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      alert('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (post: NewsPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      publishDate: post.publishDate,
    });
    setEditingId(post.id);
    setImageFile(null);
    setIsFormOpen(true);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-secondary mb-2">
              Admin Access
            </h1>
            <p className="text-center text-foreground/70 mb-8">
              Enter your password to access the admin dashboard
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter admin password"
                  disabled={loggingIn}
                  className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {passwordError}
                </p>
              )}

              <Button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loggingIn ? 'Accessing Dashboard...' : 'Access Dashboard'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                  disabled={loggingIn}
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">
              Admin Dashboard
            </h1>
            <p className="text-foreground/70 text-sm mt-1">Manage news</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              disabled={creating || loggingIn || loadingNews}
              className="bg-primary hover:bg-primary/90 text-white gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              {creating ? 'Please Wait...' : 'New Post'}
            </Button>

            <Button
              onClick={() => {
                setAuthenticated(false);
                setPassword('');
              }}
              variant="outline"
              disabled={creating || loggingIn || deletingId !== null}
              className="border-gray-300 hover:bg-gray-50 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loadingNews ? (
          <div className="text-center py-20">
            <p className="text-foreground/70 text-lg">Loading posts...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground/70 text-lg mb-6">
              No posts yet. Create your first news post!
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              disabled={creating}
              className="bg-primary hover:bg-primary/90 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? 'Loading...' : 'Create First Post'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary mb-6">
              Posts ({news.length})
            </h2>

            {news.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-secondary mb-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-foreground/60">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                    <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => handleEdit(post)}
                    variant="outline"
                    size="sm"
                    disabled={creating || deletingId === post.id}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Edit size={18} />
                  </Button>

                  <Button
                    onClick={() => setDeleteConfirmId(post.id)}
                    variant="outline"
                    size="sm"
                    disabled={creating || deletingId === post.id}
                    className="border-gray-300 hover:bg-red-50 hover:border-red-300 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!creating) {
            setIsFormOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-r from-secondary to-secondary/80 p-8 text-white rounded-t-2xl">
            <DialogTitle className="text-2xl text-white">
              {editingId ? 'Edit News Post' : 'Create New Post'}
            </DialogTitle>
            <DialogDescription className="text-white/90">
              {editingId
                ? 'Update the news post details'
                : 'Fill in the details for your news post'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Title *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                disabled={creating}
                className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Excerpt *
              </label>
              <Input
                name="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                required
                disabled={creating}
                className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Full Content *
              </label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                required
                disabled={creating}
                className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 min-h-[150px] resize-none rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Category *
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  disabled={creating}
                >
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programs">Programs</SelectItem>
                    <SelectItem value="Community Outreach">
                      Community Outreach
                    </SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Publish Date *
                </label>
                <Input
                  name="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publishDate: e.target.value,
                    }))
                  }
                  required
                  disabled={creating}
                  className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {editingId ? 'Replace Image (optional)' : 'Image *'}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required={!editingId}
                disabled={creating}
                className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={creating}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editingId
                  ? creating
                    ? 'Updating...'
                    : 'Update Post'
                  : creating
                    ? 'Creating...'
                    : 'Create Post'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="bg-red-50 border-b border-red-200 p-6">
            <DialogTitle className="text-red-700">Delete Post</DialogTitle>
            <DialogDescription className="text-red-600">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-end p-6">
            <Button
              variant="outline"
              disabled={deletingId !== null}
              onClick={() => setDeleteConfirmId(null)}
              className="border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>

            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deletingId === deleteConfirmId}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}