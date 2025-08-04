import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface CreateProposalProps {
  onClose: () => void
  cardStyles: string
}

export function CreateProposal({ onClose, cardStyles }: CreateProposalProps) {
  return (
    <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-logo-500">Create Proposal</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-full p-1"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="text-gray-400 text-center py-8">
        <p className="text-lg font-medium mb-2">TODO</p>
        <p className="text-sm">Proposal creation interface will be implemented here.</p>
      </div>
    </div>
  )
} 
