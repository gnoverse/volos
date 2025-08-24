/**
 * Returns the appropriate Tailwind CSS classes for proposal status badges.
 * @param status The proposal status (active, executed, defeated, etc.)
 * @returns CSS classes for styling the status badge
 */
export function getProposalStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'passed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}
