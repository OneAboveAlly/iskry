import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient() as any;

// Helper function to extract YouTube video ID
function extractYouTubeID(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// Get all YouTube videos with pagination
export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const topic = req.query.topic as string | undefined;

    const skip = (page - 1) * limit;

    // Base query with filter conditions
    const whereConditions: any = {};
    if (topic) {
      whereConditions.topic = topic;
    }

    // Get total count for pagination
    const totalVideos = await prisma.youTubeVideo.count({
      where: whereConditions
    });

    // Get videos for current page
    const videos = await prisma.youTubeVideo.findMany({
      where: whereConditions,
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
      },
      skip,
      take: limit
    });

    // Get unique topics for filtering
    const allTopics = await prisma.youTubeVideo.findMany({
      where: {
        topic: {
          not: null
        }
      },
      select: {
        topic: true
      },
      distinct: ['topic']
    });

    const topics = allTopics
      .map((t: { topic: string | null }) => t.topic)
      .filter((t: string | null): t is string => t !== null);

    res.json({
      videos,
      pagination: {
        total: totalVideos,
        page,
        limit,
        pages: Math.ceil(totalVideos / limit)
      },
      topics
    });
  } catch (error) {
    console.error('Error getting YouTube videos:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania filmów' });
  }
};

// Get a specific YouTube video
export const getVideoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const video = await prisma.youTubeVideo.findUnique({
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
    
    if (!video) {
      return res.status(404).json({ message: 'Film nie został znaleziony' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error getting YouTube video:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania filmu' });
  }
};

// Add a new YouTube video
export const addVideo = async (req: AuthRequest, res: Response) => {
  const { title, videoUrl, description, topic } = req.body;
  
  if (!req.authUser) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }
  
  if (!title || !videoUrl) {
    return res.status(400).json({ message: 'Tytuł i URL filmu są wymagane' });
  }
  
  try {
    // Extract video ID from URL
    const videoId = extractYouTubeID(videoUrl);
    
    if (!videoId) {
      return res.status(400).json({ message: 'Nieprawidłowy URL filmu YouTube' });
    }
    
    const video = await prisma.youTubeVideo.create({
      data: {
        title,
        videoUrl,
        videoId,
        description,
        topic,
        authorId: req.authUser.id
      }
    });
    
    res.status(201).json(video);
  } catch (error) {
    console.error('Error adding YouTube video:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas dodawania filmu' });
  }
};

// Update a YouTube video
export const updateVideo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, videoUrl, description, topic } = req.body;
  
  if (!req.authUser) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }
  
  if (!title) {
    return res.status(400).json({ message: 'Tytuł jest wymagany' });
  }
  
  try {
    const video = await prisma.youTubeVideo.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Film nie został znaleziony' });
    }
    
    // Only admins or the author can update the video
    if (!req.authUser.isAdmin && video.authorId !== req.authUser.id) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego filmu' });
    }
    
    // Process video URL if it was changed
    let videoId = video.videoId;
    if (videoUrl && videoUrl !== video.videoUrl) {
      videoId = extractYouTubeID(videoUrl) || video.videoId;
    }
    
    const updatedVideo = await prisma.youTubeVideo.update({
      where: { id: parseInt(id) },
      data: {
        title,
        videoUrl: videoUrl || video.videoUrl,
        videoId,
        description,
        topic
      }
    });
    
    res.json(updatedVideo);
  } catch (error) {
    console.error('Error updating YouTube video:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas aktualizowania filmu' });
  }
};

// Delete a YouTube video
export const deleteVideo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  if (!req.authUser) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }
  
  try {
    const video = await prisma.youTubeVideo.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Film nie został znaleziony' });
    }
    
    // Only admins or the author can delete the video
    if (!req.authUser.isAdmin && video.authorId !== req.authUser.id) {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego filmu' });
    }
    
    await prisma.youTubeVideo.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Film został usunięty' });
  } catch (error) {
    console.error('Error deleting YouTube video:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas usuwania filmu' });
  }
}; 