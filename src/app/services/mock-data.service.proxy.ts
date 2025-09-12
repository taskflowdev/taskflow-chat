import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SimpleMessageDto, SimpleGroupDto, SimpleMessageContent } from '../shared/models/simple-chat.models';

/**
 * Mock data service that demonstrates the chat functionality with all content types.
 * This service provides sample data to showcase the WhatsApp-style message previews,
 * different content type handling, and the modular proxy service architecture.
 * 
 * In production, this would be replaced by actual API calls through the proxy services.
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataServiceProxy {

  constructor() { }

  /**
   * Mock groups with different types of last messages to demonstrate WhatsApp-style previews
   */
  private mockGroups: (SimpleGroupDto & { lastMessage?: SimpleMessageDto })[] = [
    {
      groupId: '1',
      name: 'Team Chat',
      memberCount: 5,
      createdAt: new Date().toISOString(),
      lastMessage: {
        messageId: '1',
        senderId: 'user2',
        senderName: 'Alice',
        content: { $type: 'text', text: 'Hey everyone, how is the project going?' },
        contentType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      }
    },
    {
      groupId: '2', 
      name: 'Design Team',
      memberCount: 3,
      createdAt: new Date().toISOString(),
      lastMessage: {
        messageId: '2',
        senderId: 'user3',
        senderName: 'Bob',
        content: { 
          $type: 'image', 
          url: '/assets/sample-image.jpg',
          fileName: 'design-mockup.png',
          width: 1200,
          height: 800
        },
        contentType: 'image',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      }
    },
    {
      groupId: '3',
      name: 'Development',
      memberCount: 8,
      createdAt: new Date().toISOString(), 
      lastMessage: {
        messageId: '3',
        senderId: 'user4',
        senderName: 'Charlie',
        content: {
          $type: 'file',
          url: '/assets/sample-file.pdf',
          fileName: 'requirements-v2.pdf',
          fileSize: 1024768,
          mimeType: 'application/pdf'
        },
        contentType: 'file',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
      }
    },
    {
      groupId: '4',
      name: 'Marketing',
      memberCount: 4,
      createdAt: new Date().toISOString(),
      lastMessage: {
        messageId: '4', 
        senderId: 'user5',
        senderName: 'Diana',
        content: {
          $type: 'audio',
          url: '/assets/sample-audio.mp3',
          fileName: 'voice-note.mp3',
          durationSeconds: 45,
          fileSize: 512000,
          mimeType: 'audio/mpeg'
        },
        contentType: 'audio',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() // 1 hour ago
      }
    },
    {
      groupId: '5',
      name: 'Product Demo',
      memberCount: 6,
      createdAt: new Date().toISOString(),
      lastMessage: {
        messageId: '5',
        senderId: 'user6', 
        senderName: 'Eve',
        content: {
          $type: 'video',
          url: '/assets/sample-video.mp4',
          fileName: 'demo-recording.mp4',
          durationSeconds: 180,
          width: 1920,
          height: 1080,
          fileSize: 15728640,
          mimeType: 'video/mp4'
        },
        contentType: 'video',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
      }
    },
    {
      groupId: '6',
      name: 'General Discussion',
      memberCount: 12,
      createdAt: new Date().toISOString(),
      lastMessage: {
        messageId: '6',
        senderId: 'user7',
        senderName: 'Frank',
        content: {
          $type: 'poll',
          question: 'What should we have for the team lunch?',
          options: ['Pizza', 'Burgers', 'Salads', 'Asian Food']
        },
        contentType: 'poll',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
      }
    }
  ];

  /**
   * Mock messages for a specific group to demonstrate conversation view
   */
  private mockMessages: Record<string, SimpleMessageDto[]> = {
    '1': [
      {
        messageId: '1-1',
        senderId: 'user2', 
        senderName: 'Alice',
        content: { $type: 'text', text: 'Good morning everyone!' },
        contentType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        groupId: '1'
      },
      {
        messageId: '1-2',
        senderId: 'current-user',
        senderName: 'You', 
        content: { $type: 'text', text: 'Morning Alice! Ready for the standup?' },
        contentType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
        groupId: '1'
      },
      {
        messageId: '1-3',
        senderId: 'user3',
        senderName: 'Bob',
        content: {
          $type: 'image',
          url: '/assets/progress-chart.png',
          fileName: 'sprint-progress.png',
          width: 800,
          height: 600
        },
        contentType: 'image',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        groupId: '1'
      },
      {
        messageId: '1-4',
        senderId: 'user2',
        senderName: 'Alice',
        content: { $type: 'text', text: 'Great progress chart Bob! We\'re on track.' },
        contentType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        groupId: '1'
      },
      {
        messageId: '1-5',
        senderId: 'user4',
        senderName: 'Charlie',
        content: {
          $type: 'file',
          url: '/assets/meeting-notes.pdf',
          fileName: 'standup-notes-march-12.pdf',
          fileSize: 256000,
          mimeType: 'application/pdf'
        },
        contentType: 'file',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        groupId: '1'
      }
    ]
  };

  /**
   * Get all user groups with mock data
   * 
   * @returns Observable with mock group data demonstrating different content types
   */
  getMockUserGroups(): Observable<(SimpleGroupDto & { lastMessage?: SimpleMessageDto })[]> {
    return of(this.mockGroups).pipe(delay(500)); // Simulate API delay
  }

  /**
   * Get messages for a specific group 
   * 
   * @param groupId - The ID of the group
   * @returns Observable with mock messages for the group
   */
  getMockGroupMessages(groupId: string): Observable<SimpleMessageDto[]> {
    const messages = this.mockMessages[groupId] || [];
    return of(messages).pipe(delay(300)); // Simulate API delay
  }

  /**
   * Get group details by ID
   * 
   * @param groupId - The ID of the group
   * @returns Observable with mock group details
   */
  getMockGroupDetails(groupId: string): Observable<SimpleGroupDto | null> {
    const group = this.mockGroups.find(g => g.groupId === groupId);
    return of(group || null).pipe(delay(200));
  }

  /**
   * Send a mock message (simulates API call)
   * 
   * @param groupId - The ID of the group to send message to
   * @param content - The message content
   * @param contentType - The type of content being sent
   * @returns Observable with the "sent" message
   */
  sendMockMessage(
    groupId: string, 
    content: SimpleMessageContent,
    contentType: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll'
  ): Observable<SimpleMessageDto> {
    const newMessage: SimpleMessageDto = {
      messageId: 'mock-' + Date.now(),
      senderId: 'current-user',
      senderName: 'You',
      content: content,
      contentType: contentType,
      createdAt: new Date().toISOString(),
      groupId: groupId
    };

    // Add to mock data for persistence in demo
    if (!this.mockMessages[groupId]) {
      this.mockMessages[groupId] = [];
    }
    this.mockMessages[groupId].push(newMessage);

    // Update the group's last message
    const group = this.mockGroups.find(g => g.groupId === groupId);
    if (group) {
      group.lastMessage = newMessage;
    }

    return of(newMessage).pipe(delay(400)); // Simulate API delay
  }

  /**
   * Add a sample message of a specific type for demonstration
   * 
   * @param groupId - The group to add the message to
   * @param contentType - The type of content to add
   */
  addSampleMessage(groupId: string, contentType: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll'): Observable<SimpleMessageDto> {
    let content: SimpleMessageContent;
    
    switch (contentType) {
      case 'text':
        content = { $type: 'text', text: 'This is a sample text message' };
        break;
      case 'image':
        content = { 
          $type: 'image', 
          url: '/assets/sample.jpg',
          fileName: 'sample-image.jpg',
          width: 1024,
          height: 768,
          fileSize: 512000,
          mimeType: 'image/jpeg'
        };
        break;
      case 'file':
        content = {
          $type: 'file',
          url: '/assets/sample.pdf', 
          fileName: 'sample-document.pdf',
          fileSize: 1048576,
          mimeType: 'application/pdf'
        };
        break;
      case 'audio':
        content = {
          $type: 'audio',
          url: '/assets/sample.mp3',
          fileName: 'sample-audio.mp3',
          durationSeconds: 30,
          fileSize: 256000,
          mimeType: 'audio/mpeg'
        };
        break;
      case 'video':
        content = {
          $type: 'video',
          url: '/assets/sample.mp4',
          fileName: 'sample-video.mp4',
          durationSeconds: 60,
          width: 1280,
          height: 720,
          fileSize: 5242880,
          mimeType: 'video/mp4'
        };
        break;
      case 'poll':
        content = {
          $type: 'poll',
          question: 'What\'s your favorite feature?',
          options: ['Chat', 'File sharing', 'Video calls', 'Polls']
        };
        break;
      default:
        content = { $type: 'text', text: 'Unknown content type' };
    }

    return this.sendMockMessage(groupId, content, contentType);
  }
}