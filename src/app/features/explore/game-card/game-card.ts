import { Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Game } from '../../../services/game';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
})
export class GameCard {
  @Input({ required: true }) game!: Game;
}
