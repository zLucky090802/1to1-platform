import { Component } from '@angular/core';
import { InputComponent } from '../../../shared/input/input.component';
import { AuthRoutingModule } from "../auth-routing.module";

@Component({
  selector: 'app-welcome-page',
  imports: [ AuthRoutingModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss'
})
export class WelcomePageComponent {

}
