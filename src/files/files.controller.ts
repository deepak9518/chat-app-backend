
import { Controller, Post, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../config/guard/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(@UploadedFiles() files) {
    const results = await Promise.all(files.map(file => this.cloudinaryService.uploadFile(file)));
    return { urls: results };
  }
}