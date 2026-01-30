import { Test, TestingModule } from '@nestjs/testing';
import { AmplifyService } from './amplify.service';

describe('AmplifyService', () => {
  let service: AmplifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmplifyService],
    }).compile();

    service = module.get<AmplifyService>(AmplifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
