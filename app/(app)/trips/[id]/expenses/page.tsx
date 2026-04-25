import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ExpenseTracker from './expense-tracker'

export default async function ExpensesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch trip with members
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, status, organiser_id,
      trip_members ( id, member_id, invite_status, role, guest_name, first_name, last_name )
    `)
    .eq('id', params.id)
    .single()

  if (!trip) {
    notFound()
  }

  // Fetch expenses with splits
  const { data: expenses } = await supabase
    .from('trip_expenses')
    .select(`
      id, description, amount, currency, category, expense_date, split_type, paid_by, created_at,
      expense_splits ( id, trip_member_id, amount_owed, is_settled )
    `)
    .eq('trip_id', params.id)
    .order('expense_date', { ascending: false })

  // Get user's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Get the current user's trip_member record
  const currentMember = (trip as any).trip_members?.find(
    (m: any) => m.member_id === user.id
  )

  return (
    <ExpenseTracker
      trip={trip as any}
      members={(trip as any).trip_members || []}
      expenses={expenses || []}
      userId={user.id}
      currentMemberId={currentMember?.id || ''}
      userName={profile?.full_name || user.email || 'You'}
    />
  )
}
