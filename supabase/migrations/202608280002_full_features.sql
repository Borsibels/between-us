-- Full feature milestone: locations, rotating questions, and safer answer reveals.
alter table public.profiles add column if not exists address_label text not null default '';
alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles add constraint profiles_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.profiles add constraint profiles_longitude_range check (longitude is null or longitude between -180 and 180);

create or replace function public.both_answered(target_couple uuid, target_question bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select count(*) >= 2 from public.answers where couple_id = target_couple and question_id = target_question;
$$;

drop policy if exists "members read answers after both answer" on public.answers;
create policy "members read answers after both answer" on public.answers for select using(
  public.is_couple_member(couple_id) and (user_id = auth.uid() or public.both_answered(couple_id, question_id))
);
create policy "members update own answer" on public.answers for update using(user_id = auth.uid()) with check(user_id = auth.uid() and public.is_couple_member(couple_id));

insert into public.daily_questions(prompt) values
('What is one ordinary moment from today you wish we could have shared?'),
('What is something small I do that makes you feel loved?'),
('What place would you take me to first if I arrived tomorrow?'),
('What song feels most like us right now, and why?'),
('What is one thing you want us to learn together?'),
('Which memory of us made you smile recently?'),
('What would our perfect slow Sunday look like?'),
('What is something you are proud of me for?'),
('What meal are we cooking first when we are together?'),
('What is one thing the distance has taught you about us?'),
('If we could teleport for one hour tonight, where would we meet?'),
('What are you most looking forward to during our next reunion?'),
('What is one question you have been meaning to ask me?'),
('Describe our relationship using three words, then explain one of them.'),
('What tiny tradition should we start together?'),
('Which part of your day do you most wish I could see?'),
('What does feeling at home with someone mean to you?'),
('What adventure belongs on the top of our shared list?'),
('What can I do this week to make the distance feel lighter?'),
('What do you hope we will laugh about years from now?'),
('Which photo of us would you keep if you could only choose one?'),
('What is something new you noticed or learned about me recently?'),
('How should we celebrate our next small milestone?'),
('What is your favorite version of us?'),
('What is one promise you want us to keep through the distance?'),
('If today had a postcard, what would you write on it?'),
('What part of our future feels most vivid to you?'),
('What is one thing you want to thank me for today?'),
('What would make our next video date unexpectedly fun?')
on conflict(prompt) do nothing;

create index if not exists memories_couple_date_idx on public.memories(couple_id, memory_date desc);
create index if not exists answers_couple_question_idx on public.answers(couple_id, question_id);
create index if not exists date_plans_couple_planned_idx on public.date_plans(couple_id, planned_for);
