import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-info-card',
  imports: [CommonModule],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss'
})
export class InfoCardComponent {
  icon = input.required<string>()
  iconBg = input.required<string>()
  title = input.required<string>()
  subtitle = input<string>('')
  rightLabel = input<string>('')
  badge = input<string>('')
  badgeType = input<'ok' | 'pending' | 'new' | 'info' >('ok')

}
