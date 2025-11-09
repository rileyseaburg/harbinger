import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild, Tab } from '@headlessui/react'
import { 
  PlusIcon, 
  TrashIcon,
  CubeIcon,
  ArrowDownIcon,
  SparklesIcon,
  DocumentTextIcon,
  FolderIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../catalyst-ui-kit/catalyst-ui-kit/javascript/button'
import { Input } from '../catalyst-ui-kit/catalyst-ui-kit/javascript/input'

export function VariableManager({ variables, onAddVariable, onRemoveVariable, presetVariables }) {
  const [showPresets, setShowPresets] = useState(false)
  const [showPassword, setShowPassword] = useState({})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <CubeIcon className="size-4 mr-2" />
          Collection Variables ({variables.length})
        </h3>
        <Button onClick={() => setShowPresets(!showPresets)} color="light" size="sm">
          <PlusIcon className="size-4 -ml-1 mr-1" />
          Presets
        </Button>
      </div>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-800/50 dark:border-white/10"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Presets</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presetVariables.map((preset, index) => (
                <Button
                  key={index}
                  onClick={() => onAddVariable(preset)}
                  color="light"
                  size="sm"
                  className="text-xs"
                >
                  <PlusIcon className="size-3 mr-1" />
                  {preset.key}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {variables.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            <CubeIcon className="size-8 mx-auto mb-2 opacity-50" />
            No variables yet. Add variables or use presets.
          </div>
        ) : (
          variables.map((variable, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg dark:bg-white/5 dark:border-white/10"
            >
              <Input
                placeholder="Key"
                value={variable.key}
                onChange={(e) => {
                  const newVars = [...variables]
                  newVars[index].key = e.target.value
                  onRemoveVariable(index)
                  newVars.forEach(variant => onAddVariable(variant))
                }}
                className="flex-1"
              />
              <div className="relative">
                <Input
                  placeholder="Value"
                  type={
                    variable.key.toLowerCase().includes('key') || 
                    variable.key.toLowerCase().includes('secret') || 
                    variable.key.toLowerCase().includes('token')
                      ? showPassword[index] ? 'text' : 'password'
                      : 'text'
                  }
                  value={variable.value}
                  onChange={(e) => {
                    const newVars = [...variables]
                    newVars[index].value = e.target.value
                    onRemoveVariable(index)
                    newVars.forEach(variant => onAddVariable(variant))
                  }}
                  className="w-48"
                />
                {(variable.key.toLowerCase().includes('key') || 
                  variable.key.toLowerCase().includes('secret') || 
                  variable.key.toLowerCase().includes('token')) && (
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, [index]: !showPassword[index]})}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword[index] ? <EyeIcon className="size-4" /> : <EyeSlashIcon className="size-4" />}
                  </button>
                )}
              </div>
              <Button
                onClick={() => onRemoveVariable(index)}
                color="red"
                size="sm"
                plain
              >
                <TrashIcon className="size-4" />
              </Button>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New variable key..."
          className="flex-1"
          id="new-var-key"
        />
        <Input
          placeholder="Value..."
          className="flex-1"
          id="new-var-value"
        />
        <Button
          onClick={() => {
            const keyElement = document.getElementById('new-var-key')
            const valueElement = document.getElementById('new-var-value')
            if (keyElement && valueElement && keyElement.value && valueElement.value) {
              onAddVariable({ key: keyElement.value, value: valueElement.value })
              keyElement.value = ''
              valueElement.value = ''
            }
          }}
          color="indigo"
          size="sm"
        >
          <PlusIcon className="size-4 -ml-1 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

export function QuickActions({ 
  onGenerate, 
  isLoading, 
  canGenerate,
  onSave,
  onReset,
  hasContent
}) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SparklesIcon className="size-5 text-indigo-600 dark:text-indigo-400 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {canGenerate 
                ? "Ready to generate your API specification" 
                : "Select a collection to get started"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasContent && (
            <Button
              onClick={onSave}
              color="green"
              size="sm"
            >
              <DocumentArrowDownIcon className="size-4 -ml-1 mr-1" />
              Save
            </Button>
          )}
          
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || isLoading}
            color="indigo"
            size="sm"
          >
            {isLoading ? (
              <>
                <div className="animate-spin size-4 -ml-1 mr-1 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <PlayIcon className="size-4 -ml-1 mr-1" />
                Generate Spec
              </>
            )}
          </Button>
          
          {hasContent && (
            <Button
              onClick={onReset}
              color="light"
              size="sm"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function HistoryPanel({ history, onLoadHistory, onClearHistory }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <ClockIcon className="size-4 mr-2" />
          Recent Generations
        </h3>
        {history.length > 0 && (
          <Button onClick={onClearHistory} color="red" size="sm" plain>
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            <DocumentTextIcon className="size-8 mx-auto mb-2 opacity-50" />
            No history yet. Generate some specs!
          </div>
        ) : (
          history.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/5 cursor-pointer"
              onClick={() => onLoadHistory(entry)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.collectionPath.split('\\').pop() || entry.collectionPath.split('/').pop()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    entry.format === 'yaml' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {entry.format.toUpperCase()}
                  </span>
                  {entry.success ? (
                    <CheckCircleIcon className="size-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="size-4 text-red-500" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export function FilePreview({ filePath, type }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!filePath) return

    const loadContent = async () => {
      try {
        const text = await readTextFile(filePath)
        setContent(text)
        setError('')
      } catch (err) {
        setError('Failed to load file content')
      }
    }

    loadContent()
  }, [filePath])

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <FolderIcon className="size-4 mr-2 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {type} Preview
        </h3>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-gray-800/50 dark:border-white/10">
          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
            {content || 'No content loaded'}
          </pre>
        </div>
      )}
    </div>
  )
}
