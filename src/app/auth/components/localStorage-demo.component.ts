import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-localStorage-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="card">
        <div class="card-header">
          <h3>LocalStorage Service Demo</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h5>Store Token</h5>
              <div class="mb-3">
                <label for="tokenKey" class="form-label">Token Key:</label>
                <input type="text" class="form-control" id="tokenKey" [(ngModel)]="tokenKey" placeholder="e.g., taskflow_chat_token">
              </div>
              <div class="mb-3">
                <label for="tokenValue" class="form-label">Token Value:</label>
                <input type="text" class="form-control" id="tokenValue" [(ngModel)]="tokenValue" placeholder="Enter JWT token">
              </div>
              <button class="btn btn-primary me-2" (click)="storeToken()">Store Token</button>
              <button class="btn btn-secondary me-2" (click)="retrieveToken()">Retrieve Token</button>
              <button class="btn btn-danger" (click)="removeToken()">Remove Token</button>
            </div>
            <div class="col-md-6">
              <h5>Results</h5>
              <div class="alert alert-info" *ngIf="isAvailable">
                <strong>LocalStorage Status:</strong> Available ✅
              </div>
              <div class="alert alert-warning" *ngIf="!isAvailable">
                <strong>LocalStorage Status:</strong> Not Available ❌
              </div>
              <div class="alert alert-success" *ngIf="storedValue">
                <strong>Retrieved Value:</strong><br>
                <code>{{ storedValue }}</code>
              </div>
              <div class="alert alert-warning" *ngIf="noValue">
                <strong>No Value Found</strong> for key: {{ tokenKey }}
              </div>
              <div class="alert alert-primary" *ngIf="operationResult">
                <strong>Operation Result:</strong> {{ operationResult }}
              </div>
            </div>
          </div>
          
          <hr>
          
          <div class="row">
            <div class="col-12">
              <h5>Test Pre-configured Tokens</h5>
              <button class="btn btn-outline-primary me-2" (click)="testAccessToken()">Test Access Token</button>
              <button class="btn btn-outline-secondary me-2" (click)="testRefreshToken()">Test Refresh Token</button>
              <button class="btn btn-outline-info me-2" (click)="testUserData()">Test User Data</button>
              <button class="btn btn-outline-danger" (click)="clearAll()">Clear All</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LocalStorageDemoComponent {
  tokenKey = 'taskflow_chat_token';
  tokenValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  storedValue: string | null = null;
  noValue = false;
  operationResult = '';
  isAvailable = false;

  constructor(private localStorageService: LocalStorageService) {
    this.isAvailable = this.localStorageService.isAvailable();
  }

  storeToken(): void {
    if (this.tokenKey && this.tokenValue) {
      this.localStorageService.setItem(this.tokenKey, this.tokenValue);
      this.operationResult = `Token stored successfully with key: ${this.tokenKey}`;
      this.storedValue = null;
      this.noValue = false;
    }
  }

  retrieveToken(): void {
    if (this.tokenKey) {
      const value = this.localStorageService.getItem(this.tokenKey);
      if (value) {
        this.storedValue = value;
        this.noValue = false;
        this.operationResult = '';
      } else {
        this.storedValue = null;
        this.noValue = true;
        this.operationResult = '';
      }
    }
  }

  removeToken(): void {
    if (this.tokenKey) {
      this.localStorageService.removeItem(this.tokenKey);
      this.operationResult = `Token removed with key: ${this.tokenKey}`;
      this.storedValue = null;
      this.noValue = false;
    }
  }

  testAccessToken(): void {
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access_token.test';
    this.localStorageService.setItem('taskflow_chat_token', accessToken);
    this.operationResult = 'Access token stored and encrypted';
    
    // Verify it was stored
    const retrieved = this.localStorageService.getItem('taskflow_chat_token');
    if (retrieved === accessToken) {
      this.operationResult += ' ✅ Verified';
    }
  }

  testRefreshToken(): void {
    const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh_token.test';
    this.localStorageService.setItem('taskflow_chat_refresh_token', refreshToken);
    this.operationResult = 'Refresh token stored and encrypted';
    
    // Verify it was stored
    const retrieved = this.localStorageService.getItem('taskflow_chat_refresh_token');
    if (retrieved === refreshToken) {
      this.operationResult += ' ✅ Verified';
    }
  }

  testUserData(): void {
    const userData = JSON.stringify({
      id: '123',
      userName: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User'
    });
    this.localStorageService.setItem('taskflow_chat_user', userData);
    this.operationResult = 'User data stored and encrypted';
    
    // Verify it was stored
    const retrieved = this.localStorageService.getItem('taskflow_chat_user');
    if (retrieved === userData) {
      this.operationResult += ' ✅ Verified';
    }
  }

  clearAll(): void {
    this.localStorageService.removeItem('taskflow_chat_token');
    this.localStorageService.removeItem('taskflow_chat_refresh_token');
    this.localStorageService.removeItem('taskflow_chat_user');
    this.operationResult = 'All tokens and data cleared';
    this.storedValue = null;
    this.noValue = false;
  }
}