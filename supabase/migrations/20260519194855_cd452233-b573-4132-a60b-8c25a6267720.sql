
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy "Org logos are publicly readable"
on storage.objects for select
using (bucket_id = 'org-logos');

create policy "Authenticated users upload org logos in their folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'org-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users update their org logos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'org-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users delete their org logos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'org-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
