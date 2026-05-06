import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [FilesController],
  providers: [CloudinaryService],
})
export class FilesModule {}