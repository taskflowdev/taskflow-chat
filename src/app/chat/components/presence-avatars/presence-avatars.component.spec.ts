import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PresenceAvatarsComponent } from './presence-avatars.component';
import { GroupsService } from '../../../api/services/groups.service';
import { of } from 'rxjs';

describe('PresenceAvatarsComponent', () => {
  let component: PresenceAvatarsComponent;
  let fixture: ComponentFixture<PresenceAvatarsComponent>;
  let mockGroupsService: jasmine.SpyObj<GroupsService>;

  beforeEach(async () => {
    mockGroupsService = jasmine.createSpyObj('GroupsService', ['apiGroupsIdPresenceGet$Json']);
    mockGroupsService.apiGroupsIdPresenceGet$Json.and.returnValue(of({ data: [] }));

    await TestBed.configureTestingModule({
      imports: [PresenceAvatarsComponent],
      providers: [
        { provide: GroupsService, useValue: mockGroupsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PresenceAvatarsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get initials from name', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('Alice')).toBe('AL');
    expect(component.getInitials('')).toBe('??');
  });
});
