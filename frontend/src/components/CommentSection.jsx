import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function CommentSection({ noteId, token, currentUsername }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, author }
  const inputRef = useRef(null);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { Authorization: "Bearer " + token }
  });

  const fetchComments = async () => {
    try {
      const res = await axiosInstance.get("/api/notes/" + noteId + "/comments");
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchComments();
    }
  }, [noteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      await axiosInstance.post("/api/notes/" + noteId + "/comments", { 
        content: newComment.trim(),
        parent_id: replyTo ? replyTo.id : null 
      });
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (commentId, authorName) => {
    setReplyTo({ id: commentId, author: authorName });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // Convert flat comments to a nested format to support N-level replies flattened under a root comment
  const renderComments = () => {
    const commentMap = new Map(comments.map(c => [c.id, c]));
    const rootComments = [];
    const repliesByRoot = new Map();

    comments.forEach(c => {
      // If it doesn't have a parent_id, or the parent_id is missing/deleted, it's a root comment
      if (!c.parent_id || !commentMap.has(c.parent_id)) {
        rootComments.push(c);
      } else {
        // Traverse upwards to find the true root comment
        let curr = c;
        while (curr.parent_id && commentMap.has(curr.parent_id)) {
          curr = commentMap.get(curr.parent_id);
        }
        const rootId = curr.id;
        
        if (!repliesByRoot.has(rootId)) {
          repliesByRoot.set(rootId, []);
        }
        repliesByRoot.get(rootId).push(c);
      }
    });

    return rootComments.map(parent => {
      const threadReplies = repliesByRoot.get(parent.id) || [];
      
      return (
        <div key={parent.id} className="flex space-x-4 mb-6">
          <div className="flex-shrink-0">
            {parent.author_avatar ? (
              <img 
                src={parent.author_avatar} 
                alt={parent.author} 
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xl border border-indigo-200 dark:border-indigo-900/50">
                {parent.author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-2xl rounded-tl-none border border-gray-200 dark:border-slate-700 relative group">
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{parent.author}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(parent.created_at).toLocaleString()}</span>
              </div>
              <p className="text-gray-800 text-[15px] whitespace-pre-wrap">{parent.content}</p>
              <div className="flex justify-end mt-2 h-4">
                <button 
                  onClick={() => handleReply(parent.id, parent.author)} 
                  className="text-xs text-indigo-500 font-bold hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  回复
                </button>
              </div>
            
              {/* Render Replies */}
              {threadReplies.length > 0 && (
                <div className="mt-3 bg-gray-100 dark:bg-slate-700 rounded-xl p-3 space-y-2">
                  {threadReplies.map(reply => {
                    const repliedTo = commentMap.get(reply.parent_id);
                    // Decide whether to show "回复 @User": only if it's NOT directly replying to the root
                    const showReplyTo = repliedTo && repliedTo.id !== parent.id;
                    
                    return (
                        <div key={reply.id} className="text-sm group/reply relative flex space-x-2 items-start mt-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {reply.author_avatar ? (
                              <img 
                                src={reply.author_avatar} 
                                alt={reply.author} 
                                className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-slate-700" 
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] border border-indigo-200">
                                {reply.author.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline flex-wrap">
                              <span className="font-bold text-indigo-600">{reply.author}</span>
                              {showReplyTo && (
                                <>
                                  <span className="text-gray-500 dark:text-gray-400 mx-1 text-xs">回复</span>
                                  <span className="font-bold text-indigo-600">{repliedTo.author}</span>
                                </>
                              )}
                              <span className="text-gray-800 dark:text-gray-200 ml-1 whitespace-pre-wrap">：{reply.content}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <div className="text-[10px] text-gray-400">
                                {new Date(reply.created_at).toLocaleString()}
                              </div>
                              <button 
                                onClick={() => handleReply(reply.id, reply.author)} 
                                className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 opacity-0 group-hover/reply:opacity-100 transition-opacity h-4"
                              >
                                回复
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center border-b border-gray-100 dark:border-slate-700 pb-4">
        <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
        评论交流区
      </h3>
      
      <div className="mb-10">
        {comments.length === 0 ? (
          <div className="py-8 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">暂无评论，快来发布第一条评论吧 <span role="img" aria-label="smile">😊</span></p>
          </div>
        ) : (
          renderComments()
        )}
      </div>

      <div className="relative bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
        {replyTo && (
          <div className="absolute -top-4 left-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm border border-indigo-200 dark:border-indigo-900/50">
            正在回复： @{replyTo.author}
            <button onClick={cancelReply} className="ml-2 text-indigo-400 hover:text-indigo-800 p-0.5 rounded-full focus:outline-none transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-4 items-end relative z-10 w-full mt-2">
          <textarea 
            ref={inputRef}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={replyTo ? "回复 @" + replyTo.author + "..." : "分享你的想法..."}
            className={'flex-1 w-full bg-white border ' + (replyTo ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-300 focus:border-indigo-400') + ' rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y min-h-[100px] shadow-sm transition-all'}
          />
          <button 
            type="submit" 
            disabled={loading || !newComment.trim()}
            className="absolute right-4 bottom-4 bg-indigo-600 text-white p-3 rounded-lg shadow-sm cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default CommentSection;
