import { Module } from '@nestjs/common';
import { ListNoteController } from './list-note.controller';
import { ListNoteService } from './list-note.service';

@Module({
  controllers: [ListNoteController],
  providers: [ListNoteService],
})
export class ListNoteModule {}
