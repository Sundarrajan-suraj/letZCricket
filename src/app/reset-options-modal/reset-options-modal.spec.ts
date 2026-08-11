import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetOptionsModal } from './reset-options-modal';

describe('ResetOptionsModal', () => {
  let component: ResetOptionsModal;
  let fixture: ComponentFixture<ResetOptionsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetOptionsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetOptionsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
