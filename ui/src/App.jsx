import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild, Tab } from '@headlessui/react'
import { 
  Bars3Icon, 
  DocumentArrowDownIcon,
  PlayIcon,
  FolderOpenIcon,
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClockIcon,
  FolderIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../catalyst-ui-kit/catalyst-ui-kit/javascript/button'
import { Input } from '../catalyst-ui-kit/catalyst-ui-kit/javascript/input'
import { Heading } from '../catalyst-ui-kit/catalyst-ui-kit/javascript/heading'
import { VariableManager, QuickActions, HistoryPanel, FilePreview } from './EnhancedUI.jsx'

const navigation = [
  { name: 'Dashboard', href: '#', icon: CodeBracketIcon, current: true },
  { name: 'History', href: '#', icon: ClockIcon, current: false },
  { name: 'Settings', href: '#', icon: Cog6ToothIcon, current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collectionPath, setCollectionPath] = useState('')
  const [environmentPath, setEnvironmentPath] = useState('')
  const [outputFormat, setOutputFormat] = useState('yaml')
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [specContent, setSpecContent] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [errors, setErrors] = useState([])

  const selectCollection = async () => {
    try {
      const selected = await open({
        filters: [
          {
            name: 'Postman Collection',
            extensions: ['json']
          }
        ]
      })
      if (selected) {
        setCollectionPath(selected)
        setErrors([])
      }
    } catch (error) {
      setErrors(['Failed to select collection file'])
    }
  }

  const selectEnvironment = async () => {
    try {
      const selected = await open({
        filters: [
          {
            name: 'Postman Environment',
            extensions: ['json']
          }
        ]
      })
      if (selected) {
        setEnvironmentPath(selected)
        setErrors([])
      }
    } catch (error) {
      setErrors(['Failed to select environment file'])
    }
  }

  const validateCollection = async () => {
    if (!collectionPath) {
      setErrors(['Please select a collection file'])
      return false
    }
    
    try {
      const isValid = await invoke('validate_collection', { path: collectionPath })
      if (!isValid) {
        setErrors(['Invalid collection file format'])
        return false
      }
      setErrors([])
      return true
    } catch (error) {
      setErrors([`Collection validation failed: ${error}`])
      return false
    }
  }

  const generateSpec = async () => {
    if (!(await validateCollection())) {
      return
    }

    setIsRunning(true)
    setLogs([])
    setErrors([])
    setShowResult(false)

    try {
      // First get the request logs
      const requestLogs = await invoke('run_collection', {
        collectionPath,
        environmentPath: environmentPath || undefined,
      })
      setLogs(requestLogs)

      // Then generate the spec
      const result = await invoke('generate_spec', {
        collectionPath,
        environmentPath: environmentPath || undefined,
        outputFormat
      })

      if (result.success) {
        setSpecContent(result.spec_content || '')
        setShowResult(true)
      } else {
        setErrors([result.message])
      }
    } catch (error) {
      setErrors([`Error: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }

  const saveFile = async () => {
    if (!specContent) return

    const defaultName = outputFormat === 'yaml' ? 'openapi-spec.yaml' : 'api-run.har'
    
    try {
      const filePath = await save({
        defaultPath: defaultName,
        filters: [
          {
            name: outputFormat.toUpperCase(),
            extensions: outputFormat === 'yaml' ? ['yaml', 'yml'] : ['har']
          }
        ]
      })
      
      if (filePath) {
        await invoke('save_file', { 
          content: specContent, 
          default_filename: defaultName 
        })
      }
    } catch (error) {
      setErrors(['Failed to save file'])
    }
  }

  const loadCollectionData = useCallback(async () => {
    if (!collectionPath) return
    
    try {
      const content = await readTextFile(collectionPath)
      const collection = JSON.parse(content)
      setCollectionData(collection)
      
      // Extract existing variables from collection
      const collectionVars = collection.variable || []
      setVariables([...collectionVars])
    } catch (error) {
      setErrors(['Failed to load collection data'])
    }
  }, [collectionPath, setErrors, setCollectionData])

  useEffect(() => {
    if (collectionPath) {
      loadCollectionData()
    }
  }, [collectionPath, loadCollectionData])
  
  const addVariable = () => {
    if (!newVariable.key || !newVariable.value) return
    
    setVariables([...variables, { 
      key: newVariable.key, 
      value: newVariable.value 
    }])
    setNewVariable({ key: '', value: '' })
  }
  
  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index))
  }
  
  const reset = () => {
    setCollectionPath('')
    setEnvironmentPath('')
    setLogs([])
    setSpecContent('')
    setShowResult(false)
    setErrors([])
    setCollectionData(null)
    setVariables([])
  }
  
  const saveToHistory = () => {
    const entry = {
      timestamp: new Date().toISOString(),
      collectionPath,
      environmentPath,
      format: outputFormat,
      success: true
    }
    setHistory(prev => [entry, ...prev].slice(0, 10))
  }
  
  const loadFromHistory = (entry) => {
    setCollectionPath(entry.collectionPath)
    setEnvironmentPath(entry.environmentPath)
    setOutputFormat(entry.format)
    setActiveTab(0)
  }

  return (
    <div>
      {/* Mobile sidebar */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300" />
        <div className="fixed inset-0 flex">
          <DialogPanel transition className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300">
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <XMarkIcon className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 dark:bg-gray-900">
              <div className="flex h-16 shrink-0 items-center">
                <div className="h-8 w-auto flex items-center text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  Harbinger
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.href}
                            className={classNames(
                              item.current
                                ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <item.icon
                              className={classNames(
                                item.current
                                  ? 'text-indigo-600 dark:text-white'
                                  : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                'size-6 shrink-0',
                              )}
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-900">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10">
          <div className="flex h-16 shrink-0 items-center">
            <div className="h-8 w-auto flex items-center text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              Harbinger
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current
                              ? 'text-indigo-600 dark:text-white'
                              : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                            'size-6 shrink-0',
                          )}
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 sm:px-6 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <Bars3Icon className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900 dark:text-white">Harbinger</div>
      </div>

      {/* Main content */}
      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <Heading level={1}>Harbinger</Heading>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            The herald of your API's true nature - Transform Postman collections into accurate OpenAPI specifications with live response analysis
          </p>

          {/* Quick Actions Bar */}
          <div className="mt-6">
            <QuickActions
              onGenerate={generateSpec}
              isLoading={isRunning}
              canGenerate={!!collectionPath}
              onSave={saveFile}
              onReset={reset}
              hasContent={!!specContent}
            />
          </div>

          {/* Tab Navigation */}
          <div className="mt-8">
            <Tabs value={activeTab} onChange={setActiveTab} className="flex space-x-8 border-b border-gray-200 dark:border-white/10">
              <Tab className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:border-indigo-400 dark:data-[selected]:text-indigo-400">
                Configuration
              </Tab>
              <Tab className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:border-indigo-400 dark:data-[selected]:text-indigo-400">
                Variables
              </Tab>
              <Tab className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:border-indigo-400 dark:data-[selected]:text-indigo-400">
                History
              </Tab>
              <Tab className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:border-indigo-400 dark:data-[selected]:text-indigo-400">
                Results
              </Tab>
            </Tabs>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 0 && (
                <div className="space-y-8">
                  {/* File selectors */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FolderOpenIcon className="size-4 inline mr-1" />
                        Postman Collection
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={collectionPath}
                          readOnly
                          placeholder="Select collection..."
                          className="flex-1"
                        />
                        <Button onClick={selectCollection} color="light">
                          Browse
                        </Button>
                      </div>
                      {collectionPath && (
                        <FilePreview filePath={collectionPath} type="Collection" />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FolderOpenIcon className="size-4 inline mr-1" />
                        Environment (Optional)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={environmentPath}
                          readOnly
                          placeholder="Select environment..."
                          className="flex-1"
                        />
                        <Button onClick={selectEnvironment} color="light">
                          Browse
                        </Button>
                      </div>
                      {environmentPath && (
                        <FilePreview filePath={environmentPath} type="Environment" />
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Generation Options
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Output Format
                        </label>
                        <div className="mt-2 flex gap-3">
                          <Button
                            color={outputFormat === 'yaml' ? 'indigo' : 'light'}
                            onClick={() => setOutputFormat('yaml')}
                          >
                            OpenAPI.yaml
                          </Button>
                          <Button
                            color={outputFormat === 'har' ? 'indigo' : 'light'}
                            onClick={() => setOutputFormat('har')}
                          >
                            HAR File
                          </Button>
                        </div>
                      </div>

                      {/* Advanced Options */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={autoSave}
                            onChange={(e) => setAutoSave(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Auto-save after generation
                          </span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Dark mode
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <VariableManager
                  variables={variables}
                  onAddVariable={addVariable}
                  onRemoveVariable={removeVariable}
                  presetVariables={presetVariables}
                />
              )}

              {activeTab === 2 && (
                <HistoryPanel
                  history={history}
                  onLoadHistory={loadFromHistory}
                  onClearHistory={() => setHistory([])}
                />
              )}

              {activeTab === 3 && (
                <div className="space-y-8">
                  {/* Status Summary */}
                  {isRunning && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Generating specification...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Running requests and analyzing responses
                      </p>
                    </div>
                  )}

                  {/* Stats Dashboard */}
                  {logs.length > 0 && (
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 dark:bg-white/5 dark:border-white/10">
                        <div className="flex items-center">
                          <CheckCircleIcon className="size-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Requests</p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                              {logs.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 dark:bg-white/5 dark:border-white/10">
                        <div className="flex items-center">
                          <SparklesIcon className="size-5 text-indigo-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Endpoints</p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                              {new Set(logs.map(log => log.url)).size}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 dark:bg-white/5 dark:border-white/10">
                        <div className="flex items-center">
                          <ChartBarIcon className="size-5 text-purple-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                              {(logs.reduce((acc, log) => acc + log.duration_ms, 0) / logs.length).toFixed(0)}ms
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request logs */}
                  {logs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Request Logs
                      </h3>
                      <div className="space-y-2">
                        {logs.map((log, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-gray-200 rounded-lg p-4 dark:bg-white/5 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  log.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  log.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                  log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  log.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {log.method}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.url}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.status < 400 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {log.status}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {log.duration_ms.toFixed(0)}ms
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated spec */}
                  <AnimatePresence>
                    {showResult && specContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Generated {outputFormat.toUpperCase()}
                          </h3>
                          <div className="flex gap-2">
                            <Button onClick={() => {
                              navigator.clipboard.writeText(specContent)
                              // Show toast notification here
                            }} color="light" size="sm">
                              Copy to clipboard
                            </Button>
                            <Button onClick={saveFile} color="indigo">
                              <DocumentArrowDownIcon className="size-4 -ml-0.5 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm font-mono">
                            {specContent}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Error messages */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-4 right-4 z-50 max-w-md"
              >
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="size-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Errors</h4>
                      <ul className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
