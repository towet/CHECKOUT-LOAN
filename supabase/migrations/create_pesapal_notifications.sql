-- Create the pesapal_notifications table
create table if not exists public.pesapal_notifications (
  id uuid default gen_random_uuid() primary key,
  order_tracking_id text not null,
  order_merchant_reference text not null,
  order_notification_type text not null,
  raw_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.pesapal_notifications enable row level security;

-- Create policy to allow insert only
create policy "Allow inserts from authenticated users" 
  on public.pesapal_notifications
  for insert 
  with check (true);

-- Create policy to allow select for authenticated users
create policy "Allow select for authenticated users" 
  on public.pesapal_notifications
  for select 
  using (true);

-- Create index on order_tracking_id for faster lookups
create index if not exists idx_pesapal_notifications_order_tracking_id 
  on public.pesapal_notifications(order_tracking_id);

-- Create index on order_merchant_reference for faster lookups
create index if not exists idx_pesapal_notifications_order_merchant_reference 
  on public.pesapal_n? What would you like to do? (Use arrow keys)
  > ⇄  Connect this directory to an existing Netlify site
    +  Create & configure a new sitetifications(order_merchant_reference);
