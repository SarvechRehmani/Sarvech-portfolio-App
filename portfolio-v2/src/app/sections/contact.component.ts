import {ToastService} from '../core/toast.service';
import {CmsService} from '../core/cms.service';
import {
  Component,
  ViewEncapsulation,
  signal,
  inject,
  DestroyRef,
} from "@angular/core";
import {
  EmailService,
  EmailFailure,
  ContactMessage,
} from "../core/email.service";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
@Component({
  selector: "[portfolioContact]",
  imports:[ReactiveFormsModule],
  templateUrl: "./contact.component.html",
  encapsulation: ViewEncapsulation.None,
  styles:[`.contact-paused{align-self:center;padding:35px;text-align:center;border-radius:22px}.contact-paused h3{font-size:25px}.contact-paused p{font-size:14px;color:var(--muted);margin:17px 0}.contact-paused a{color:var(--accent);font-size:15px}`],
})
export class ContactComponent {
 readonly cms=inject(CmsService);
 get disabled(){return this.cms.snapshot()['layout']?.contact_enabled===false;}
  readonly contactForm=new FormGroup({name:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(100)]}),email:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.email,Validators.maxLength(150)]}),subject:new FormControl('Project collaboration',{nonNullable:true,validators:[Validators.required]}),message:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(10),Validators.maxLength(3000)]})});
  private readonly email = inject(EmailService);
  private readonly toast=inject(ToastService);
  private controller: AbortController | null = null;
  readonly sending = signal(false);
  readonly status = signal("Send your message directly to my inbox.");
  readonly state = signal("");
  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }
  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    if (this.disabled||this.sending() || !form.reportValidity()) return;
    const data = new FormData(form);
    const message = Object.fromEntries(
      ["name", "email", "subject", "message"].map((key) => [
        key,
        String(data.get(key) || "").trim(),
      ]),
    ) as unknown as ContactMessage;
    if (!message.name || message.message.length < 10) {
      this.state.set("error");
      this.status.set(
        "Please enter your name and a message of at least 10 characters.",
      );
      return;
    }
    this.sending.set(true);
    this.state.set("sending");
    this.status.set("Sending your message…");
    const controller = new AbortController();
    this.controller = controller;
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      await this.email.send(message, controller.signal);
      this.state.set("success");
      this.status.set(
        "Your message has been sent. Thank you for reaching out!",
      );
      this.toast.show(this.status(),'success');
      form.reset();
      this.contactForm.reset({subject:'Project collaboration'});
    } catch (error) {
      this.state.set("error");
      this.status.set(
        error instanceof Error && error.name === "AbortError"
          ? "Sending took too long to confirm. Your message is still here. Please wait before retrying, or email me directly."
          : error instanceof EmailFailure && error.status === 429
            ? "Too many requests right now. Please try again later or email me at sarwech99@gmail.com."
            : "Your message could not be sent. Please try again or email me at sarwech99@gmail.com.",
      );
      this.toast.show(this.status(),'error');
    } finally {
      clearTimeout(timer);
      this.sending.set(false);
      this.controller = null;
    }
  }
}
