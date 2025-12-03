-- =====================================================
-- The Prodigious Piggy - Database Schema
-- Run this in Supabase SQL Editor after connecting
-- =====================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.subscription_tier as enum ('free', 'pro', 'business');
create type public.place_category as enum ('restaurant', 'cafe', 'bar', 'bakery', 'food_truck', 'market');
create type public.reaction_type as enum ('like', 'dislike', 'love', 'want_to_go', 'been_there');

-- =====================================================
-- USER PROFILES
-- =====================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  subscription_tier subscription_tier default 'free',
  subscription_expires_at timestamptz,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- =====================================================
-- USER ROLES (Separate table for security)
-- =====================================================

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- PLACES
-- =====================================================

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  address text,
  city text,
  country text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  category place_category,
  cuisine_type text[],
  price_level int check (price_level between 1 and 4),
  rating decimal(2, 1) check (rating between 0 and 5),
  sentiment_score decimal(3, 2) check (sentiment_score between 0 and 1),
  photos text[],
  phone text,
  website text,
  opening_hours jsonb,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.places enable row level security;

-- RLS Policies for places
create policy "Places are viewable by everyone"
  on public.places for select
  using (true);

create policy "Admins can manage places"
  on public.places for all
  using (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- USER REACTIONS (likes, saves, etc.)
-- =====================================================

create table public.user_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  reaction_type reaction_type not null,
  created_at timestamptz default now(),
  unique (user_id, place_id, reaction_type)
);

alter table public.user_reactions enable row level security;

-- RLS Policies for user_reactions
create policy "Users can view their own reactions"
  on public.user_reactions for select
  using (auth.uid() = user_id);

create policy "Users can create their own reactions"
  on public.user_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own reactions"
  on public.user_reactions for delete
  using (auth.uid() = user_id);

-- =====================================================
-- CHAT HISTORY
-- =====================================================

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- RLS Policies for chat
create policy "Users can view their own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view messages from their sessions"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions
      where id = chat_messages.session_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create messages in their sessions"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions
      where id = chat_messages.session_id
      and user_id = auth.uid()
    )
  );

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  paddle_subscription_id text,
  paddle_customer_id text,
  tier subscription_tier not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- RLS Policies for subscriptions
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Assign default user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  -- Create free subscription
  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'free', 'active');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger places_updated_at
  before update on public.places
  for each row execute procedure public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('place-photos', 'place-photos', true);

-- Storage RLS Policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Place photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'place-photos');

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_places_city on public.places(city);
create index idx_places_category on public.places(category);
create index idx_places_location on public.places(latitude, longitude);
create index idx_user_reactions_user on public.user_reactions(user_id);
create index idx_user_reactions_place on public.user_reactions(place_id);
create index idx_chat_messages_session on public.chat_messages(session_id);
