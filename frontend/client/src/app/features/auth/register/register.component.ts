import { Component } from '@angular/core';

import { AuthRoutingModule } from "../auth-routing.module";
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-register',
  imports: [InputComponent, AuthRoutingModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

}
