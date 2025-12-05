import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrength {
  score: number; // 0-4
  label: string; // 'Weak', 'Fair', 'Good', 'Strong'
  color: string; // CSS color
  percentage: number; // 0-100
  feedback: string[];
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-strength.component.html',
  styleUrl: './password-strength.component.scss'
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';
  @Input() showFeedback: boolean = true;

  strength: PasswordStrength = {
    score: 0,
    label: '',
    color: '#dee2e6',
    percentage: 0,
    feedback: []
  };

  ngOnChanges(): void {
    this.strength = this.calculateStrength(this.password);
  }

  private calculateStrength(password: string): PasswordStrength {
    if (!password || password.length === 0) {
      return {
        score: 0,
        label: '',
        color: '#dee2e6',
        percentage: 0,
        feedback: []
      };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('At least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('At least one lowercase letter');
    }

    // Number check
    if (/[0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('At least one number');
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('At least one special character');
    }

    // Bonus for length
    if (password.length >= 12) {
      score = Math.min(score + 1, 5);
    }

    // Map score to strength
    let label = '';
    let color = '';
    let percentage = 0;

    if (score <= 1) {
      label = 'Weak';
      color = '#dc3545';
      percentage = 20;
    } else if (score === 2) {
      label = 'Fair';
      color = '#fd7e14';
      percentage = 40;
    } else if (score === 3) {
      label = 'Good';
      color = '#ffc107';
      percentage = 60;
    } else if (score === 4) {
      label = 'Strong';
      color = '#20c997';
      percentage = 80;
    } else {
      label = 'Very Strong';
      color = '#28a745';
      percentage = 100;
    }

    return {
      score,
      label,
      color,
      percentage,
      feedback
    };
  }
}
