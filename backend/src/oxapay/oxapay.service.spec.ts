import { Test, TestingModule } from '@nestjs/testing';
import { OxapayService } from './oxapay.service';

describe('OxapayService', () => {
  let service: OxapayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OxapayService],
    }).compile();

    service = module.get<OxapayService>(OxapayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
