import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: false
})
export class ConfirmDialogComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed with this action?';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() isDanger: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('modalTpl') modalTpl!: TemplateRef<unknown>;

  private modalRef: NgbModalRef | null = null;

  constructor(private modalService: NgbModal) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen && !this.modalRef) {
        // Defer opening slightly to ensure ViewChild is resolved
        setTimeout(() => this.openModal(), 0);
      } else if (!this.isOpen && this.modalRef) {
        this.closeModal();
      }
    }
  }

  openModal(): void {
    if (this.modalRef || !this.modalTpl) {
      return;
    }
    this.modalRef = this.modalService.open(this.modalTpl, {
      centered: true,
      backdrop: 'static',
      keyboard: true
    });

    this.modalRef.result.then(
      () => {
        this.modalRef = null;
      },
      () => {
        this.modalRef = null;
        this.cancelled.emit();
      }
    );
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.dismiss();
      this.modalRef = null;
    }
  }

  onConfirm(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
    this.confirmed.emit();
  }

  onCancel(): void {
    this.closeModal();
    this.cancelled.emit();
  }
}
