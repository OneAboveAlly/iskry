import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, AuthRequest, requireAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/multerConfig';
import path from 'path';
import fs from 'fs';
import { io, userSocketMap } from '../index';

interface FileWithValidationRequest extends AuthRequest {
  file?: Express.Multer.File;
  fileValidationError?: string;
}

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/posts - Get all published posts for public viewing
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('GET /api/posts - Trying to fetch all posts');
    
    // Check if pagination parameters are provided
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    
    let posts;
    let pagination;
    
    if (page && limit) {
      // Pagination is requested
      const skip = (page - 1) * limit;
      const totalPosts = await prisma.post.count();
      const totalPages = Math.ceil(totalPosts / limit);
      
      posts = await prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  surname: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
      
      pagination = {
        currentPage: page,
        totalPages,
        totalItems: totalPosts,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } else {
      // No pagination - return all posts
      posts = await prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  surname: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: posts.length,
        itemsPerPage: posts.length,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
    
    console.log(`Successfully fetched ${posts.length} posts`);
    
    res.json({
      posts,
      pagination
    });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    res.json({ 
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }
});

// GET /api/posts/:id - Get a specific post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to fetch post with ID: ${id}`);
    
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      }
    });
    
    if (!post) {
      console.log(`Post with ID ${id} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log(`Successfully fetched post with ID: ${id}`);
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
});

// POST /api/posts - Create a new post (admin only)
router.post('/', auth, requireAdmin, upload.single('image'), async (req: FileWithValidationRequest, res: Response) => {
  try {
    console.log('POST /api/posts - Attempting to create a new post');
    
    if (req.fileValidationError) {
      console.error('File validation error:', req.fileValidationError);
      return res.status(400).json({ message: req.fileValidationError });
    }
    
    const { title, content, publishedAt } = req.body;
    console.log(`Title length: ${title?.length}, Content length: ${content?.length}`);
    
    const authorId = req.authUser?.id;
    
    // Validate required fields
    if (!title || !content) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Validate author ID
    if (!authorId) {
      console.error('Missing author ID');
      return res.status(401).json({ message: 'Unauthorized - Author ID is missing' });
    }

    // Process content to handle base64 embedded images if any
    let processedContent = content;
    
    try {
      // Look for base64 image patterns in content (ReactQuill embeds them as base64)
      const base64Pattern = /<img[^>]*src=["']data:image\/(jpeg|png|gif|webp);base64,([^"']*)/gi;
      let match;
      let matchCount = 0;
      
      // Replace base64 images with saved images
      while ((match = base64Pattern.exec(content)) !== null) {
        try {
          const mimeType = match[1];
          const base64Data = match[2];
          
          // Create a unique filename
          const filename = `embedded-${Date.now()}-${matchCount++}.${mimeType}`;
          const filePath = path.join(__dirname, '../../uploads', filename);
          
          // Sprawdź czy dane base64 nie są puste
          if (!base64Data || base64Data.trim() === '') {
            console.warn('Empty base64 data detected, skipping image extraction');
            continue;
          }
          
          // Zapisz plik obrazka
          try {
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            console.log(`Successfully saved embedded image: ${filename}`);
            
            // Sprawdź czy plik faktycznie istnieje po zapisie
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              if (stats.size === 0) {
                console.warn(`Warning: Saved image file ${filename} has zero size`);
              } else {
                console.log(`Image saved successfully with size: ${stats.size} bytes`);
              }
            } else {
              console.warn(`Warning: Failed to verify saved image ${filename}`);
            }
          } catch (fsError) {
            console.error(`Error saving embedded image ${filename}:`, fsError);
            continue; // Skip this image and continue with the next
          }
          
          // Replace the base64 image with a URL in the content
          const imageUrl = `/uploads/${filename}`;
          processedContent = processedContent.replace(match[0], `<img src="${imageUrl}`);
        } catch (err) {
          console.error('Error processing embedded image:', err);
        }
      }
    } catch (imageProcessingError) {
      console.error('Error processing images in content:', imageProcessingError);
      // Continue with the original content if image processing fails
      processedContent = content;
    }
    
    // Przygotuj URL obrazka
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Przygotuj datę publikacji
    const pubDate = publishedAt ? new Date(publishedAt) : new Date();
    
    // Użyj bezpośredniego zapytania SQL
    try {
      console.log('Trying direct SQL INSERT');
      
      // Alternatywne podejście - używając Prisma ORM zamiast bezpośredniego SQL
      const post = await prisma.post.create({
        data: {
          title,
          content: processedContent,
          author: {
            connect: { id: authorId }
          },
          publishedAt: pubDate,
          imageUrl,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        }
      });
      
      console.log('Post created successfully via Prisma ORM');
      res.status(201).json(post);
    } catch (dbError) {
      console.error('Database error creating post:', dbError);
      
      // Fallback do bezpośredniego SQL tylko w przypadku błędu Prisma
      try {
        // Zapytanie SQL INSERT
        const insertQuery = `
          INSERT INTO "Post" (
            "title", 
            "content", 
            "authorId", 
            "publishedAt", 
            "imageUrl", 
            "createdAt", 
            "updatedAt"
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const now = new Date();
        
        // Wykonaj zapytanie
        const result: any = await prisma.$queryRawUnsafe(
          insertQuery,
          title,
          processedContent,
          authorId,
          pubDate,
          imageUrl,
          now,
          now
        );
        
        console.log('Post created successfully via SQL fallback');
        
        // Jeśli wynik jest tablicą, zwróć pierwszy element
        if (Array.isArray(result) && result.length > 0) {
          res.status(201).json(result[0]);
        } else {
          // Wygeneruj dane odpowiedzi, aby klient mógł działać
          res.status(201).json({
            id: 0,
            title,
            content: processedContent,
            authorId,
            publishedAt: pubDate,
            imageUrl,
            createdAt: now,
            updatedAt: now,
            author: { id: authorId, name: "User", surname: "Unknown" }
          });
        }
      } catch (sqlError) {
        console.error('SQL Error creating post:', sqlError);
        throw new Error('Database error creating post');
      }
    }
  } catch (error) {
    console.error('Server error creating post:', error);
    res.status(500).json({ message: 'Server error while creating post', error: String(error) });
  }
});

// PUT /api/posts/:id - Update a post (admin only)
router.put('/:id', auth, requireAdmin, upload.single('image'), async (req: FileWithValidationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, publishedAt } = req.body;
    
    // First check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Process content to handle base64 embedded images if any
    let processedContent = content;
    
    if (content) {
      // Look for base64 image patterns in content (ReactQuill embeds them as base64)
      const base64Pattern = /<img[^>]*src=["']data:image\/(jpeg|png|gif|webp);base64,([^"']*)/gi;
      let match;
      let matchCount = 0;
      
      // Replace base64 images with saved images
      while ((match = base64Pattern.exec(content)) !== null) {
        try {
          const mimeType = match[1];
          const base64Data = match[2];
          
          // Create a unique filename
          const filename = `embedded-${Date.now()}-${matchCount++}.${mimeType}`;
          const filePath = path.join(__dirname, '../../uploads', filename);
          
          // Sprawdź czy dane base64 nie są puste
          if (!base64Data || base64Data.trim() === '') {
            console.warn('Empty base64 data detected, skipping image extraction');
            continue;
          }
          
          // Zapisz plik obrazka
          try {
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            console.log(`Successfully saved embedded image: ${filename}`);
            
            // Sprawdź czy plik faktycznie istnieje po zapisie
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              if (stats.size === 0) {
                console.warn(`Warning: Saved image file ${filename} has zero size`);
              } else {
                console.log(`Image saved successfully with size: ${stats.size} bytes`);
              }
            } else {
              console.warn(`Warning: Failed to verify saved image ${filename}`);
            }
          } catch (fsError) {
            console.error(`Error saving embedded image ${filename}:`, fsError);
            continue; // Skip this image and continue with the next
          }
          
          // Replace the base64 image with a URL in the content
          const imageUrl = `/uploads/${filename}`;
          processedContent = processedContent.replace(match[0], `<img src="${imageUrl}`);
        } catch (err) {
          console.error('Error processing embedded image:', err);
        }
      }
    }
    
    // Prepare data for update
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = processedContent;
    if (publishedAt) updateData.publishedAt = new Date(publishedAt);
    
    // Only update image if a new one is uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    console.log('Updating post with data:', updateData);
    
    // Update the post
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
});

// DELETE /api/posts/:id - Delete a post (admin only)
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Delete the post
    await prisma.post.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
});

// GET /api/posts/:id/comments/count - Get the count of comments for a post
router.get('/:id/comments/count', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const count = await prisma.comment.count({
      where: { postId: parseInt(id) }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    res.status(500).json({ message: 'Server error while fetching comment count', count: 0 });
  }
});

// POST /api/posts/:id/comments - Add a comment to a post
router.post('/:id/comments', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, notifyParticipants } = req.body;
    const authorId = req.authUser?.id;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // First get the post to know who the author is
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      select: {
        title: true,
        authorId: true
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(id),
        authorId: authorId!
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true
          }
        }
      }
    });

    // Get a list of distinct users who have commented on this post (for notifications)
    const commentAuthors = await prisma.comment.findMany({
      where: { 
        postId: parseInt(id)
      },
      select: {
        authorId: true
      },
      distinct: ['authorId']
    });

    // Create a set of unique user IDs to notify
    const usersToNotify = new Set<number>();
    
    // Always add post author to notifications if they are not the commenter
    if (post.authorId !== authorId) {
      usersToNotify.add(post.authorId);
    }
    
    // If notifyParticipants is true, also notify other comment authors
    if (notifyParticipants) {
      commentAuthors.forEach(author => {
        // Only add comment authors who are not the current commenter
        if (author.authorId !== authorId) {
          usersToNotify.add(author.authorId);
        }
      });
    }

    // Send notifications to all relevant users
    console.log('Users to notify:', Array.from(usersToNotify));
    for (const userId of usersToNotify) {
      try {
        console.log(`Creating notification for user ${userId}`);
        // Create a notification in the database
        const notification = await prisma.notification.create({
          data: {
            content: userId === post.authorId
              ? `${comment.author.name} ${comment.author.surname} dodał(a) komentarz do twojego posta "${post.title}"`
              : `${comment.author.name} ${comment.author.surname} dodał(a) komentarz do dyskusji, w której uczestniczysz: "${post.title}"`,
            userId,
            postId: parseInt(id),
            isRead: false
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true
              }
            },
            post: {
              select: {
                id: true,
                title: true,
                content: true,
                imageUrl: true,
                publishedAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true
                  }
                }
              }
            }
          }
        });
        console.log('Notification created:', {
          id: notification.id,
          content: notification.content,
          userId: notification.userId,
          postId: notification.postId,
          isRead: notification.isRead
        });

        // Send real-time notification via Socket.IO
        const recipientSocketId = userSocketMap.get(userId);
        console.log(`User ${userId} socket ID:`, recipientSocketId);
        if (recipientSocketId) {
          console.log(`Sending notification to user ${userId} via socket ${recipientSocketId}`);
          io.to(recipientSocketId).emit('new_notification', notification);
        } else {
          console.log(`User ${userId} is not connected via socket, notification will be available on next fetch`);
        }
      } catch (notificationError) {
        console.error(`Error creating notification for user ${userId}:`, notificationError);
        // Continue with other notifications even if one fails
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: parseInt(id) },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.comment.count({
        where: { postId: parseInt(id) }
      })
    ]);

    const totalPages = Math.ceil(totalComments / limit);

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalComments,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
});

// DELETE /api/comments/:id - Delete a comment (admin only)
router.delete('/comments/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Comment deleted successfully', comment });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

// PUT /api/comments/:id - Update a comment (admin only)
router.put('/comments/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content }
    });

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error while updating comment' });
  }
});

// Usuwanie komentarza przez admina
router.delete('/:postId/comments/:commentId', auth, requireAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });
    res.json({ message: 'Komentarz usunięty' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas usuwania komentarza' });
  }
});

export default router; 