import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMessageComponent, ChatMessageData } from './chat-message.component';

describe('ChatMessageComponent', () => {
  let component: ChatMessageComponent;
  let fixture: ComponentFixture<ChatMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatMessageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display text message content', () => {
    const testMessage: ChatMessageData = {
      messageId: '1',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'Hello, this is a test message',
      contentType: 'text',
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.message-content').textContent.trim()).toContain('Hello, this is a test message');
  });

  it('should display image message with icon', () => {
    const testMessage: ChatMessageData = {
      messageId: '2',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'photo.jpg',
      contentType: 'image',
      contentData: { fileName: 'photo.jpg', contentType: 'image' },
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.media-message')).toBeTruthy();
    expect(compiled.querySelector('.bi-image')).toBeTruthy();
    expect(compiled.querySelector('.message-content').textContent).toContain('photo.jpg');
  });

  it('should display video message with duration', () => {
    const testMessage: ChatMessageData = {
      messageId: '3',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'video.mp4',
      contentType: 'video',
      contentData: { fileName: 'video.mp4', duration: 125, contentType: 'video' },
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.media-message')).toBeTruthy();
    expect(compiled.querySelector('.bi-play-circle')).toBeTruthy();
    expect(compiled.querySelector('.message-content').textContent).toContain('video.mp4');
    expect(compiled.querySelector('.duration').textContent).toContain('2:05');
  });

  it('should display poll message with question and options', () => {
    const testMessage: ChatMessageData = {
      messageId: '4',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'What is your favorite color?',
      contentType: 'poll',
      contentData: { 
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
        contentType: 'poll'
      },
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.poll-message')).toBeTruthy();
    expect(compiled.querySelector('.poll-question').textContent).toContain('What is your favorite color?');
    expect(compiled.querySelectorAll('.poll-option').length).toBe(3);
  });

  it('should display file message with size', () => {
    const testMessage: ChatMessageData = {
      messageId: '5',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'document.pdf',
      contentType: 'file',
      contentData: { fileName: 'document.pdf', fileSize: 2048000, contentType: 'file' },
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.file-message')).toBeTruthy();
    expect(compiled.querySelector('.bi-file-earmark')).toBeTruthy();
    expect(compiled.querySelector('.message-content').textContent).toContain('document.pdf');
    expect(compiled.querySelector('.file-size').textContent).toContain('2.0 MB');
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(65)).toBe('1:05');
    expect(component.formatDuration(125)).toBe('2:05');
    expect(component.formatDuration(3661)).toBe('61:01');
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
    expect(component.formatFileSize(1048576)).toBe('1.0 MB');
    expect(component.formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('should display sender name for non-own messages', () => {
    const testMessage: ChatMessageData = {
      messageId: '6',
      senderId: 'user1',
      senderName: 'Test User',
      content: 'Test message',
      createdAt: new Date().toISOString(),
      isOwn: false
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.sender-name').textContent).toBe('Test User');
  });

  it('should not display sender name for own messages', () => {
    const testMessage: ChatMessageData = {
      messageId: '7',
      senderId: 'user2',
      senderName: 'Me',
      content: 'My message',
      createdAt: new Date().toISOString(),
      isOwn: true
    };
    
    component.message = testMessage;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.sender-name')).toBeFalsy();
  });
});
