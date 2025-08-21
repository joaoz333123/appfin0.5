'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Send,
  RefreshCw,
  FileText,
  Globe,
  BookOpen,
  X,
  Image,
  File,
  Video,
  Mic,
  Paperclip,
  Eye,
  Edit,
  Plus,
  CheckCircle,
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
  attachments?: File[];
  metadata?: {
    web?: boolean;
    deepResearch?: boolean;
    storageAccess?: boolean;
    fileOperations?: string[];
  };
}

interface Gemini {
  web: boolean;
  deepResearch: boolean;
  storageAccess: boolean;
  fileRead: boolean;
  fileWrite: boolean;
  fileEdit: boolean;
  maxTokens: number;
  temperature: number;
}

interface StorageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  lastModified: Date;
  content?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content:
        'Olá! Sou o Gemini avançado do AppFin. Tenho acesso completo aos seus dados e posso:\n\n🔍 **Pesquisa Web** - Buscar informações atualizadas\n📚 **Deep Research** - Análise profunda de documentos\n💾 **Storage Access** - Ler, escrever e editar arquivos\n📎 **Anexos** - Processar imagens, PDFs, áudios e vídeos\n\nConfigure as funcionalidades abaixo e comece a usar!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [selectedStorageFiles, setSelectedStorageFiles] = useState<string[]>(
    []
  );
  const [showStorage, setShowStorage] = useState(false);
  const [geminiConfig, setGeminiConfig] = useState<Gemini>({
    web: false,
    deepResearch: false,
    storageAccess: true,
    fileRead: true,
    fileWrite: true,
    fileEdit: true,
    maxTokens: 24000,
    temperature: 1.0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  (() => {
    scrollToBottom();
  }, [messages]);

  (() => {
    // Carregar arquivos do storage
    loadStorageFiles();
  }, []);

  const loadStorageFiles = async () => {
    try {
      const response = await fetch('/api/storage/list');
      if (response.ok) {
        const files = await response.json();
        setStorageFiles(files);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (_index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleStorageFile = (fileId: string) => {
    setSelectedStorageFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      attachments: [...attachments],
      metadata: {
        web: geminiConfig.web,
        deepResearch: geminiConfig.deepResearch,
        storageAccess: geminiConfig.storageAccess,
        fileOperations: [
          geminiConfig.fileRead ? 'read' : '',
          geminiConfig.fileWrite ? 'write' : '',
          geminiConfig.fileEdit ? 'edit' : '',
        ].filter(Boolean),
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      // Preparar dados para envio
      const formData = new FormData();
      formData.append('message', input);
      formData.append('settings', JSON.stringify(gemini));
      formData.append('storageFiles', JSON.stringify(selectedStorageFiles));

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.content,
          timestamp: new Date(),
          _data: result.data,
          metadata: {
            web: result.metadata?.web,
            deepResearch: result.metadata?.deepResearch,
            storageAccess: result.metadata?.storageAccess,
            fileOperations: result.metadata?.fileOperations,
          },
        };

        setMessages(prev => [...prev, aiMessage]);

        // Recarregar arquivos se houve modificações
        if (result.metadata?.storageModified) {
          loadStorageFiles();
        }
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content:
          'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (setting: keyof Gemini) => {
    setGeminiConfig(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className='w-4 h-4' />;
    if (file.type.startsWith('video/')) return <Video className='w-4 h-4' />;
    if (file.type.startsWith('audio/')) return <Mic className='w-4 h-4' />;
    return <File className='w-4 h-4' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Gemini Avançado
              </h1>
              <p className='text-gray-600'>
                IA com acesso completo aos seus dados e funcionalidades
                avançadas
              </p>
            </div>
            <Button
              variant='outline'
              onClick={() => setShowStorage(!showStorage)}
              className='flex items-center space-x-2'
            >
              <FileText className='w-4 h-4' />
              <span>Configurações</span>
            </Button>
          </div>
        </div>

        {/* Configurações do Gemini */}
        {showStorage && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Configurações do Gemini</CardTitle>
              <CardDescription>
                Ative ou desative as funcionalidades avançadas
              </CardDescription>
            </CardHeader>
                          <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant={gemini.web ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => toggleSetting('web')}
                    className='flex items-center space-x-2'
                  >
                    <Globe className='w-4 h-4' />
                    <span>Web </span>
                  </Button>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant={
                      gemini.deepResearch ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => toggleSetting('deepResearch')}
                    className='flex items-center space-x-2'
                  >
                    <BookOpen className='w-4 h-4' />
                    <span>Deep Research</span>
                  </Button>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant={
                      geminiConfig.storageAccess ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => toggleSetting('storageAccess')}
                    className='flex items-center space-x-2'
                  >
                    <FileText className='w-4 h-4' />
                    <span>Storage Access</span>
                  </Button>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant={geminiConfig.fileRead ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => toggleSetting('fileRead')}
                    className='flex items-center space-x-2'
                  >
                    <Eye className='w-4 h-4' />
                    <span>File Read</span>
                  </Button>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant={gemini.fileWrite ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => toggleSetting('fileWrite')}
                    className='flex items-center space-x-2'
                  >
                    <Plus className='w-4 h-4' />
                    <span>File Write</span>
                  </Button>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant={gemini.fileEdit ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => toggleSetting('fileEdit')}
                    className='flex items-center space-x-2'
                  >
                    <Edit className='w-4 h-4' />
                    <span>File Edit</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className='grid lg:grid-cols-4 gap-6'>
          {/* Chat Principal */}
          <div className='lg:col-span-2'>
            <Card className='h-[700px] flex flex-col'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <MessageSquare className='w-5 h-5' />
                  <span>Chat com Gemini</span>
                </CardTitle>
                <CardDescription>
                  Converse com IA avançada e acesse seus dados
                </CardDescription>
              </CardHeader>

              <CardContent className='flex-1 flex flex-col'>
                {/* Messages */}
                <div className='flex-1 overflow-y-auto space-y-4 mb-4'>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className='whitespace-pre-wrap'>{message.content}</p>

                        {/* Metadata */}
                        {message.metadata && (
                          <div className='mt-2 pt-2 border-t border-gray-200'>
                            <div className='flex flex-wrap gap-1'>
                              {message.metadata.web && (
                                <Badge variant='outline' className='text-xs'>
                                  <Globe className='w-3 h-3 mr-1' />
                                  Web
                                </Badge>
                              )}
                              {message.metadata.deepResearch && (
                                <Badge variant='outline' className='text-xs'>
                                  <BookOpen className='w-3 h-3 mr-1' />
                                  Deep Research
                                </Badge>
                              )}
                              {message.metadata.storageAccess && (
                                <Badge variant='outline' className='text-xs'>
                                  <FileText className='w-3 h-3 mr-1' />
                                  Storage
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <p
                          className={`text-xs mt-1 ${
                            message.type === 'user'
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className='flex justify-start'>
                      <div className='bg-gray-100 p-3 rounded-lg'>
                        <div className='flex items-center space-x-2'>
                          <RefreshCw className='w-4 h-4 animate-spin' />
                          <span className='text-sm text-gray-600'>
                            Processando...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Anexos */}
                {attachments.length > 0 && (
                  <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
                    <h4 className='text-sm font-medium mb-2'>Anexos:</h4>
                    <div className='space-y-2'>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-2 bg-white rounded border'
                        >
                          <div className='flex items-center space-x-2'>
                            {getFileIcon(file)}
                            <div>
                              <div className='text-sm font-medium'>
                                {file.name}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeAttachment(index)}
                          >
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className='flex space-x-2'>
                  <div className='flex-1 flex space-x-2'>
                    <input
                      type='text'
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSend()}
                      placeholder='Digite sua mensagem...'
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={loading}
                    />
                    <input
                      ref={fileInputRef}
                      type='file'
                      multiple
                      onChange={handleFile}
                      className='hidden'
                      accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Paperclip className='w-4 h-4' />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                  >
                    <Send className='w-4 h-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Files */}
          <div className='lg:col-span-1'>
            <Card className='h-[700px] flex flex-col'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <FileText className='w-5 h-5' />
                  <span>Storage Files</span>
                </CardTitle>
                <CardDescription>
                  Arquivos disponíveis para o Gemini
                </CardDescription>
              </CardHeader>

              <div className='flex-1 overflow-y-auto'>
                <div className='space-y-2'>
                  {storageFiles.map(file => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStorageFiles.includes(file.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleStorageFile(file.id)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <FileText className='w-4 h-4 text-gray-400' />
                          <div>
                            <div className='text-sm font-medium'>
                              {file.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {formatFileSize(file.size)} • {file.type}
                            </div>
                          </div>
                        </div>
                        {selectedStorageFiles.includes(file.id) && (
                          <CheckCircle className='w-4 h-4 text-blue-600' />
                        )}
                      </div>
                    </div>
                  ))}

                  {storageFiles.length === 0 && (
                    <div className='text-center text-gray-500 py-8'>
                      <div className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                      <p>Nenhum arquivo no storage</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Status e Controles */}
          <div className='lg:col-span-1'>
            <Card className='h-[700px] flex flex-col'>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Monitoramento e controles</CardDescription>
              </CardHeader>

              <div className='flex-1 space-y-6'>
                {/* Status das Funcionalidades */}
                <div>
                  <h4 className='font-medium mb-3'>Funcionalidades Ativas</h4>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Web </span>
                      <Badge
                        variant={
                          gemini.web ? 'default' : 'secondary'
                        }
                      >
                        {gemini.web ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Deep Research</span>
                      <Badge
                        variant={
                          gemini.deepResearch ? 'default' : 'secondary'
                        }
                      >
                        {gemini.deepResearch ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Storage Access</span>
                      <Badge
                        variant={
                          gemini.storageAccess ? 'default' : 'secondary'
                        }
                      >
                        {gemini.storageAccess ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>File Read</span>
                      <Badge
                        variant={
                          gemini.fileRead ? 'default' : 'secondary'
                        }
                      >
                        {gemini.fileRead ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>File Write</span>
                      <Badge
                        variant={
                          gemini.fileWrite ? 'default' : 'secondary'
                        }
                      >
                        {gemini.fileWrite ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>File Edit</span>
                      <Badge
                        variant={
                          gemini.fileEdit ? 'default' : 'secondary'
                        }
                      >
                        {gemini.fileEdit ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div>
                  <h4 className='font-medium mb-3'>Estatísticas</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span>Arquivos no Storage:</span>
                      <span className='font-medium'>{storageFiles.length}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Arquivos Selecionados:</span>
                      <span className='font-medium'>
                        {selectedStorageFiles.length}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Mensagens:</span>
                      <span className='font-medium'>{messages.length}</span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div>
                  <h4 className='font-medium mb-3'>Ações Rápidas</h4>
                  <div className='space-y-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                      onClick={() =>
                        setSelectedStorageFiles(storageFiles.map(f => f.id))
                      }
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Selecionar Todos
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                      onClick={() => setSelectedStorageFiles([])}
                    >
                      <X className='w-4 h-4 mr-2' />
                      Limpar Seleção
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                      onClick={loadStorageFiles}
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Atualizar Storage
                    </Button>
                  </div>
                </div>

                {/* Informações de Segurança */}
                <div className='p-3 bg-green-50 rounded-lg'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>
                      Seguro
                    </span>
                  </div>
                  <p className='text-xs text-green-700'>
                    O Gemini não pode excluir arquivos ou danificar o sistema.
                    Todas as operações são seguras e auditáveis.
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sugestões de Uso */}
        <div className='mt-8'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Exemplos de Uso
          </h3>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              'Analise os pedidos de compra do último mês',
              'Crie um relatório sobre orçamentos vs comprometido',
              'Pesquise sobre tendências de preços no mercado',
              'Edite o arquivo de política de aprovação',
              'Leia e resuma os anexos dos pedidos',
              'Busque informações sobre fornecedores',
              'Analise imagens de cotações',
              'Gere dashboards personalizados',
            ].map((sugestao, index) => (
              <Button
                key={index}
                variant='outline'
                className='justify-start text-left h-auto p-3'
                onClick={() => setInput(sugestao)}
              >
                {sugestao}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
