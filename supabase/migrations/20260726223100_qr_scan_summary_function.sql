-- Efficient QR scan summary aggregation for dashboard analytics

create or replace function public.get_qr_scan_summaries(
  p_restaurant_id uuid,
  p_today_start timestamptz
)
returns table (
  qr_code_id uuid,
  today_scans bigint,
  last_scan timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    qr_code_id,
    count(*) filter (where scanned_at >= p_today_start) as today_scans,
    max(scanned_at) as last_scan
  from public.qr_code_scans
  where restaurant_id = p_restaurant_id
  group by qr_code_id;
$$;

grant execute on function public.get_qr_scan_summaries(uuid, timestamptz) to authenticated;
