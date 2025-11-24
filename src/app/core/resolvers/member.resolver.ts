import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { MemberService } from '../services/network/member.service';
import { Member } from '../entities/member.entity';

export const memberResolver: ResolveFn<Member> = (route) => {
  const memberService = inject(MemberService);
  const id = route.paramMap.get('id')!;
  return memberService.getOne(id);
};
