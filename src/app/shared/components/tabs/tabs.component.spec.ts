import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent, Tab } from './tabs.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  const mockTabs: Tab[] = [
    { id: 'tab1', label: 'Tab 1', icon: 'bi-info' },
    { id: 'tab2', label: 'Tab 2', icon: 'bi-people' },
    { id: 'tab3', label: 'Tab 3', icon: 'bi-gear', disabled: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    component.tabs = mockTabs;
    component.activeTabId = 'tab1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all tabs', () => {
    const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
    expect(tabButtons.length).toBe(3);
  });

  it('should mark active tab with active class', () => {
    const activeButton = fixture.debugElement.query(By.css('.tab-button.active'));
    expect(activeButton).toBeTruthy();
    expect(activeButton.nativeElement.textContent).toContain('Tab 1');
  });

  it('should set aria-selected=true for active tab', () => {
    const activeButton = fixture.debugElement.query(By.css('.tab-button.active'));
    expect(activeButton.nativeElement.getAttribute('aria-selected')).toBe('true');
  });

  it('should emit tabChange event when clicking non-active tab', () => {
    spyOn(component.tabChange, 'emit');
    const secondTab = fixture.debugElement.queryAll(By.css('.tab-button'))[1];
    secondTab.nativeElement.click();
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
  });

  it('should not emit tabChange event when clicking active tab', () => {
    spyOn(component.tabChange, 'emit');
    const firstTab = fixture.debugElement.query(By.css('.tab-button.active'));
    firstTab.nativeElement.click();
    expect(component.tabChange.emit).not.toHaveBeenCalled();
  });

  it('should not emit tabChange event when clicking disabled tab', () => {
    spyOn(component.tabChange, 'emit');
    const disabledTab = fixture.debugElement.queryAll(By.css('.tab-button'))[2];
    disabledTab.nativeElement.click();
    expect(component.tabChange.emit).not.toHaveBeenCalled();
  });

  it('should disable tab with disabled property', () => {
    const disabledTab = fixture.debugElement.queryAll(By.css('.tab-button'))[2];
    expect(disabledTab.nativeElement.disabled).toBe(true);
    expect(disabledTab.nativeElement.classList.contains('disabled')).toBe(true);
  });

  it('should render icons when provided', () => {
    const firstTab = fixture.debugElement.query(By.css('.tab-button'));
    const icon = firstTab.query(By.css('.tab-icon'));
    expect(icon).toBeTruthy();
    expect(icon.nativeElement.classList.contains('bi-info')).toBe(true);
  });

  it('should handle ArrowRight key to move to next tab', () => {
    spyOn(component.tabChange, 'emit');
    const firstTab = fixture.debugElement.query(By.css('.tab-button'));
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    firstTab.nativeElement.dispatchEvent(event);
    fixture.detectChanges();
    // Should emit tab2 (skipping disabled tab3 is not tested here as it requires more complex setup)
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
  });

  it('should handle ArrowLeft key to move to previous tab', () => {
    component.activeTabId = 'tab2';
    fixture.detectChanges();
    spyOn(component.tabChange, 'emit');
    const secondTab = fixture.debugElement.queryAll(By.css('.tab-button'))[1];
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    component.onKeyDown(event, 1);
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab1');
  });

  it('should handle Home key to move to first enabled tab', () => {
    component.activeTabId = 'tab2';
    fixture.detectChanges();
    spyOn(component.tabChange, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Home' });
    component.onKeyDown(event, 1);
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab1');
  });

  it('should handle End key to move to last enabled tab', () => {
    component.activeTabId = 'tab1';
    fixture.detectChanges();
    spyOn(component.tabChange, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'End' });
    component.onKeyDown(event, 0);
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
  });

  it('should have vertical orientation by default', () => {
    const container = fixture.debugElement.query(By.css('.tabs-container'));
    expect(container.nativeElement.classList.contains('tabs-vertical')).toBe(true);
  });

  it('should support horizontal orientation', () => {
    // Create a new component instance to avoid state from previous tests
    const newFixture = TestBed.createComponent(TabsComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.tabs = mockTabs;
    newComponent.activeTabId = 'tab1';
    newComponent.orientation = 'horizontal';
    newFixture.detectChanges();
    
    const container = newFixture.debugElement.query(By.css('.tabs-container'));
    expect(container.nativeElement.classList.contains('tabs-horizontal')).toBe(true);
    expect(container.nativeElement.classList.contains('tabs-vertical')).toBe(false);
  });

  it('should have role=tablist on tabs list', () => {
    const tabsList = fixture.debugElement.query(By.css('.tabs-list'));
    expect(tabsList.nativeElement.getAttribute('role')).toBe('tablist');
  });

  it('should set tabindex=0 for active tab and -1 for others', () => {
    const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
    expect(tabButtons[0].nativeElement.getAttribute('tabindex')).toBe('0'); // active
    expect(tabButtons[1].nativeElement.getAttribute('tabindex')).toBe('-1'); // not active
    expect(tabButtons[2].nativeElement.getAttribute('tabindex')).toBe('-1'); // disabled
  });
});
