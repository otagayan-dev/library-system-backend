import { Test, TestingModule } from '@nestjs/testing';
import { PenaltiesService } from './penalties.service';

describe('PenaltiesService', () => {
  let service: PenaltiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PenaltiesService],
    }).compile();

    service = module.get<PenaltiesService>(PenaltiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
