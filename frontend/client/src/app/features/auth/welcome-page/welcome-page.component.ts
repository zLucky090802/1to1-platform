import { Component } from '@angular/core';

import { AuthRoutingModule } from "../auth-routing.module";
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';


@Component({
  selector: 'app-welcome-page',
  imports: [ AuthRoutingModule, InfoCardComponent],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss'
})
export class WelcomePageComponent {

}
