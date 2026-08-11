import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-reset-options-modal',
  imports: [],
  templateUrl: './reset-options-modal.html',
  styleUrls: ['./reset-options-modal.scss']
})
export class ResetOptionsModal {
  @Output() close = new EventEmitter<'same' | 'new' | null>();

  selectSame() {
    this.close.emit('same');
  }

  selectNew() {
    this.close.emit('new');
  }

  cancel() {
    this.close.emit(null);
  }
}
