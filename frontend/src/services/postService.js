import api from './api';

export const postService = {
  // Get Feed (Handles both initial load and pagination)
  getFeed: async (url = 'posts/') => {
    // Strip the domain to prevent double URLs
    const cleanUrl = url.replace(/^https?:\/\/[^\/]+\/api\//, '');
    
    const response = await api.get(cleanUrl);
    return response.data;
  },

  // Create or Update
  savePost: async (postData, id = null) => {
    if (id) {
      return await api.patch(`posts/${id}/`, postData);
    } else {
      return await api.post('posts/', postData);
    }
  },

  deletePost: async (id) => {
    return await api.delete(`posts/${id}/`);
  },

  //  BOOKMARK ACTIONS ===
  toggleBookmark: async (postId) => {
    // Matches the DRF endpoint: path('posts/<int:post_id>/bookmark/', ...)
    return await api.post(`posts/${postId}/bookmark/`);
  },

  getBookmarks: async () => {
    // Matches the DRF endpoint: path('posts/bookmarks/', ...)
    const response = await api.get('posts/bookmarks/');
    return response.data;
  },
  
  // Helpers
  formatTags: (tagString) => {
    if (!tagString) return []; 
    return tagString.split(',')
      .map(tag => tag.trim().replace(/^#/, '').toLowerCase())
      .filter(t => t !== '');
  }
};