"use client"

import { useState, useEffect, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, RefreshCw, ChevronDown, ExternalLink, Clock, Hash, Users, MessageSquare, Check } from "lucide-react"
import { NetworkIcon } from "@web3icons/react"

// Updated data types to match real API
interface Message {
  chainId: number
  blockNumber: number
  blockTimestamp: number
  txnHash: string
  sender: string
  receiver: string
  content: string
  value: number
}

interface ApiResponse {
  result: Message[]
  pagination: {
    limit: number
    offset: number
    count: number
  }
  search?: {
    query: string
  }
}

// Supported networks (extend/adjust IDs as needed)
const chains: Record<number, { name: string; slug: string }> = {
  1: { name: "Ethereum", slug: "ethereum" },
  11155111: { name: "Ethereum Sepolia", slug: "ethereum" },
  8453: { name: "Base", slug: "base" },
  84532: { name: "Base Sepolia", slug: "base" },
  34443: { name: "Mode", slug: "mode" },
  34444: { name: "Worldchain", slug: "worldcoin" },
  57073: { name: "Ink", slug: "ink" },
  130: { name: "Unichain", slug: "unichain" },
  7777777: { name: "Zora", slug: "zora" },
  60808: { name: "BOB", slug: "bob" },
  1868: { name: "Soneium", slug: "soneium" },
  360: { name: "Shape", slug: "shape" },
  42161: { name: "Arbitrum One", slug: "arbitrum" },
  137: { name: "Polygon", slug: "polygon" },
} as const

// Helper function to handle content display
const formatContent = (content: string): string => {
  if (content === "|undefined" || !content) return "No message content"
  return content
}

// ---------------------------------------------------------------------------
// Generic copy-to-clipboard helper component --------------------------------
// ---------------------------------------------------------------------------

interface CopyableProps {
  text: string
  children: ReactNode
}

function Copyable({ text, children }: CopyableProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Copy failed", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : text}
      className="bg-muted px-1 rounded text-xs font-mono hover:bg-muted/80 transition-colors focus:outline-none inline-flex items-center gap-1"
    >
      {children}
      {copied && <Check className="w-3 h-3 text-green-500" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Real API helpers -----------------------------------------------------------
// ---------------------------------------------------------------------------

const fetchLatestMessages = async (limit = 10, offset = 0): Promise<ApiResponse> => {
  const res = await fetch(`/api/idx/latest?limit=${limit}&offset=${offset}`)
  console.log("fetchLatestMessages", res);
  const rawData = (await res.json()) as any

  if (!rawData || !Array.isArray(rawData.result)) {
    throw new Error("Unexpected /latest-messages response format")
  }

  // Normalize message fields to our Message interface
  const normalizeMessage = (raw: any): Message => ({
    chainId: Number(raw.chainId),
    blockNumber: Number(raw.blockNumber),
    blockTimestamp: Number(raw.blockTimestamp),
    txnHash: raw.txnHash,
    sender: raw.sender,
    receiver: raw.receiver,
    content: raw.content,
    value: Number(raw.value),
  })

  return {
    ...rawData,
    result: rawData.result.map(normalizeMessage),
  }
}

const fetchSearchMessages = async (content: string, limit = 10, offset = 0): Promise<ApiResponse> => {
  const encoded = encodeURIComponent(content)
  const res = await fetch(`/api/idx/search?content=${encoded}&limit=${limit}&offset=${offset}`)
  console.log("fetchSearchMessages", res);
  const rawData = (await res.json()) as any

  if (!rawData || !Array.isArray(rawData.result)) {
    throw new Error("Unexpected /search-messages response format")
  }

  const normalizeMessage = (raw: any): Message => ({
    chainId: Number(raw.chainId),
    blockNumber: Number(raw.blockNumber),
    blockTimestamp: Number(raw.blockTimestamp),
    txnHash: raw.txnHash,
    sender: raw.sender,
    receiver: raw.receiver,
    content: raw.content,
    value: Number(raw.value),
  })

  return {
    ...rawData,
    result: rawData.result.map(normalizeMessage),
  }
}

function MessageCard({ message }: { message: Message }) {
  const [showFull, setShowFull] = useState(false)
  const chain = chains[message.chainId] || {
    name: `Chain ${message.chainId}`,
    slug: "ethereum",
  }

  const formattedContent = formatContent(message.content)
  const truncatedContent = formattedContent.length > 150 ? formattedContent.substring(0, 150) + "..." : formattedContent
  const shouldTruncate = formattedContent.length > 150

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleString()
  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <NetworkIcon id={chain.slug} size={24} variant="branded" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {chain.name}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTime(message.blockTimestamp)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">From:</span>
            <Copyable text={message.sender}>{formatAddress(message.sender)}</Copyable>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <Copyable text={message.receiver}>{formatAddress(message.receiver)}</Copyable>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Block:</span>
            <code className="bg-muted px-1 rounded text-xs">#{formatNumber(message.blockNumber)}</code>
          </div>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tx:</span>
            <Copyable text={message.txnHash}>{formatAddress(message.txnHash)}</Copyable>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Message Content</span>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm leading-relaxed font-mono break-words">
              {showFull ? formattedContent : truncatedContent}
            </p>
          </div>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFull(!showFull)}
              className="h-auto p-0 text-xs text-primary hover:no-underline"
            >
              {showFull ? "Show Less" : "Show More"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SimIDXTeaser() {
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, count: 0 })

  // Updated search suggestions based on real data patterns
  const searchSuggestions = ["zachXBT", "erc-20", "mint", "facet", "opensea", "gov", "data:", "author"]

  // Initial load ------------------------------------------------------------
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true)
        const data = await fetchLatestMessages(pagination.limit, 0)
        setMessages(data.result)
        setPagination(data.pagination)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for new messages ----------------------------------------------------
  useEffect(() => {
    if (searchQuery) return // don't poll while searching

    const interval = setInterval(async () => {
      try {
        const data = await fetchLatestMessages(1, 0)
        if (messages.length === 0) return

        const latestKnownHash = messages[0].txnHash
        const index = data.result.findIndex((m) => m.txnHash === latestKnownHash)
        const diff = index === -1 ? data.result.length : index

        if (diff > 0) {
          setNewMessageCount(diff)
          setHasNewMessages(true)
        }
      } catch (err) {
        console.error(err)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [messages, searchQuery])

  const handleRefresh = async () => {
    if (!hasNewMessages) return
    try {
      setLoading(true)
      const data = await fetchLatestMessages(newMessageCount || pagination.limit, 0)
      const unique = data.result.filter((m) => !messages.find((msg) => msg.txnHash === m.txnHash))
      setMessages((prev) => [...unique, ...prev])
      setHasNewMessages(false)
      setNewMessageCount(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true)
      const newOffset = pagination.offset + pagination.limit
      const data = searchQuery
        ? await fetchSearchMessages(searchQuery, pagination.limit, newOffset)
        : await fetchLatestMessages(pagination.limit, newOffset)
      setMessages((prev) => [...prev, ...data.result])
      setPagination({ ...pagination, offset: newOffset })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setPagination({ ...pagination, offset: 0 })

    if (query.trim() === "") {
      // Reset to latest messages
      try {
        setLoading(true)
        const data = await fetchLatestMessages(pagination.limit, 0)
        setMessages(data.result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      const data = await fetchSearchMessages(query, pagination.limit, 0)
      setMessages(data.result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(
    (message) =>
      searchQuery === "" ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.receiver.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold">Onchain Message Explorer</h1>
                <p className="text-xs text-muted-foreground">Real-time Multi-chain Indexing with SimIDX</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://sim.dune.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm">Explore Sim IDX</Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats grid removed as per user request */}

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Content Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search messages, addresses, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleSearch(searchQuery)} disabled={loading}>
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
              {searchQuery && (
                <Button variant="outline" onClick={() => handleSearch("")} disabled={loading}>
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Quick search:</span>
              {searchSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(suggestion)}
                  className="h-7 text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                {searchQuery ? `Search Results for "${searchQuery}"` : "Real-time Message Feed"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasNewMessages && (
                  <Button onClick={handleRefresh} disabled={loading} size="sm">
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Show New Messages
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && !loadingMore ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
                {searchQuery && (
                  <Button variant="ghost" onClick={() => handleSearch("")} className="mt-2">
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {filteredMessages.map((message, idx) => (
                  <MessageCard key={`${message.txnHash}-${idx}`} message={message} />
                ))}

                <div className="flex justify-center pt-4">
                  <Button onClick={handleLoadMore} disabled={loadingMore || loading} variant="outline" className="w-full max-w-xs">
                    {loadingMore ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    )}
                    {loadingMore ? "Loading messages" : "Load More Messages"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
