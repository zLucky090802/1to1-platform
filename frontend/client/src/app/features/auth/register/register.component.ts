import { Component } from '@angular/core';
import { InputComponent } from '../../../shared/input/input.component';
import { AuthRoutingModule } from "../auth-routing.module";

@Component({
  selector: 'app-register',
  imports: [InputComponent, AuthRoutingModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

}
