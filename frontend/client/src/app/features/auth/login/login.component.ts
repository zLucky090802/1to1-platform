import { Component } from '@angular/core';

import { AuthRoutingModule } from "../auth-routing.module";
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  imports: [InputComponent, AuthRoutingModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
