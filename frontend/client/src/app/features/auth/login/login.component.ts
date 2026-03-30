import { Component } from '@angular/core';
import { InputComponent } from '../../../shared/input/input.component';
import { AuthRoutingModule } from "../auth-routing.module";

@Component({
  selector: 'app-login',
  imports: [InputComponent, AuthRoutingModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
