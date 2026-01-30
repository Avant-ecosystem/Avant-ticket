import { Test, TestingModule } from '@nestjs/testing';
import { OxapayController } from './oxapay.controller';
import { OxapayService } from './oxapay.service';

describe('OxapayController', () => {
  let controller: OxapayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OxapayController],
      providers: [OxapayService],
    }).compile();

    controller = module.get<OxapayController>(OxapayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
