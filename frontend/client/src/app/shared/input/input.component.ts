import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-input',
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  type = input<string>('text');
  placeholder = input<string>('Write here...');
  icon = input<string | null>(null);
  secondIcon = input<string | null>(null);

  // 🔥 NUEVO
  mode = input<'text' | 'dropdown'>('text');
  options = input<string[]>([]);

  isOpen = signal(false);
  selected = signal<string | null>(null);

  toggleDropdown() {
    if (this.mode() === 'dropdown') {
      this.isOpen.update(v => !v);
    }
  }

  select(option: string) {
    this.selected.set(option);
    this.isOpen.set(false);

}
}