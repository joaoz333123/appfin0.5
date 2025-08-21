'use client';

import { GlossaryText } from '@/components/glossary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  CheckCircle,
  FileText,
  Paperclip,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema Zod aprimorado com validações em tempo real
const pedidoSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .regex(/^[^<>]*$/, 'Título não pode conter caracteres especiais < >'),
  categoria: z
    .string()
    .min(1, 'Categoria é obrigatória')
    .refine(
      val => ['OPEX', 'CAPEX', 'TI', 'MARKETING', 'RH', 'FINANCEIRO', 'OPERACIONAL'].includes(val),
      'Categoria deve ser uma das opções válidas'
    ),
  cc: z
    .string()
    .min(1, 'Centro de custo é obrigatório')
    .refine(
      val => ['ADM', 'TI', 'MARKETING', 'RH', 'FINANCEIRO', 'OPERACIONAL'].includes(val),
      'Centro de custo deve ser uma das opções válidas'
    ),
  projeto: z
    .string()
    .optional()
    .refine(
      val => !val || val.length <= 50,
      'Nome do projeto deve ter no máximo 50 caracteres'
    ),
  valor: z
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .min(0.01, 'Valor deve ser maior que zero')
    .max(1000000, 'Valor não pode exceder R$ 1.000.000'),
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .regex(/^[^<>]*$/, 'Descrição não pode conter caracteres especiais < >'),
});

type PedidoForm = z.infer<typeof pedidoSchema>;

// Componente helper para campos validados
const ValidatedField = ({
  label,
  name,
  type = 'text',
  register,
  errors,
  touchedFields,
  className = '',
  placeholder = '',
  description = '',
  children
}: {
  label: string;
  name: keyof PedidoForm;
  type?: string;
  register: any;
  errors: any;
  touchedFields: any;
  className?: string;
  placeholder?: string;
  description?: string;
  children?: React.ReactNode;
}) => {
  const hasError = errors[name];
  const isTouched = touchedFields[name];
  const isValid = isTouched && !hasError;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {label}
        {isValid && <Check className="w-4 h-4 text-green-600" />}
        {hasError && <AlertCircle className="w-4 h-4 text-red-600" />}
      </label>

      {children ? (
        children
      ) : (
        <input
          {...register(name)}
          type={type}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 transition-colors duration-200
            ${hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
              : isValid
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${className}
          `}
          placeholder={placeholder}
        />
      )}

      {description && !hasError && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {hasError && (
        <p className="text-red-600 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {hasError.message}
        </p>
      )}
    </div>
  );
};

export default function NovoPedidoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sugestaoCategoria, setSugestaoCategoria] = useState<string>('');
  const [validacaoAnexos, setValidacaoAnexos] = useState<any>(null);
  const [duplicatas, setDuplicatas] = useState<any[]>([]);
  const [verificandoDuplicatas, setVerificandoDuplicatas] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, touchedFields, isValid },
  } = useForm<PedidoForm>({
    resolver: zodResolver(pedidoSchema),
    mode: 'onBlur', // Validação ao sair do campo
    reValidateMode: 'onChange', // Re-validação durante digitação
  });

  const watchedTitulo = watch('titulo');
  const watchedDescricao = watch('descricao');

  // Sugerir categoria quando título ou descrição mudam
  React.useEffect(() => {
    if (watchedTitulo && watchedDescricao) {
      // Simular sugestão da IA
      const sugestoes = {
        notebook: 'TI',
        computador: 'TI',
        software: 'TI',
        mobiliário: 'OPEX',
        mobiliario: 'OPEX',
        equipamento: 'CAPEX',
        servidor: 'CAPEX',
        marketing: 'MARKETING',
        publicidade: 'MARKETING',
        treinamento: 'RH',
        consultoria: 'FINANCEIRO',
      };

      const texto = `${watchedTitulo} ${watchedDescricao}`.toLowerCase();
      for (const [palavra, categoria] of Object.entries(sugestoes)) {
        if (texto.includes(palavra)) {
          setSugestaoCategoria(categoria);
          break;
        }
      }
    }
  }, [watchedTitulo, watchedDescricao]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (_index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (_data: PedidoForm) => {
    try {
      // Verificar duplicatas primeiro
      setVerificandoDuplicatas(true);
      const duplicatasResponse = await fetch(
        '/api/pedidos/verificar-duplicatas',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: data.titulo,
            categoria: data.categoria,
            valor: data.valor,
            solicitante_id: 'user123', // TODO: pegar do usuário logado
            cc: data.cc,
          }),
        }
      );

      if (duplicatasResponse.ok) {
        const { duplicatas: duplicatasEncontradas } =
          await duplicatasResponse.json();
        setDuplicatas(duplicatasEncontradas);

        if (duplicatasEncontradas.length > 0) {
          setVerificandoDuplicatas(false);
          return; // Não prosseguir se há duplicatas
        }
      }
      setVerificandoDuplicatas(false);

      // Simular validação de anexos
      const valor = data.valor;
      const anexosMin = ['descricao'];

      if (valor > 1000) anexosMin.push('cotacao');
      if (valor > 5000) anexosMin.push('justificativa');
      if (valor > 25000) anexosMin.push('proposta_tecnica');

      const anexosAtuais = files.map(f => f.name.toLowerCase());
      const valid = anexosMin.every(anexo =>
        anexosAtuais.some(nome => nome.includes(anexo))
      );

      setValidacaoAnexos({
        valid,
        missing: anexosMin.filter(
          anexo => !anexosAtuais.some(nome => nome.includes(anexo))
        ),
        suggestions: valid ? [] : ['Adicione os anexos obrigatórios'],
      });

      if (valid) {
        // Enviar pedido usando FormData
        const formData = new FormData();
        formData.append('titulo', data.titulo);
        formData.append('categoria', data.categoria);
        formData.append('cc', data.cc);
        if (data.projeto) formData.append('projeto', data.projeto);
        formData.append('valor', data.valor.toString());
        formData.append('descricao', data.descricao);

        // Adicionar anexos
        files.forEach(file => {
          formData.append('anexos', file);
        });

        const response = await fetch('/api/pedidos', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Pedido criado:', result);
          // Redirecionar para inbox
          window.location.href = '/inbox';
        } else {
          const _error = await response.json();
          console.error('Erro ao criar pedido:', error);
          alert(
            'Erro ao criar pedido: ' + (error.error || 'Erro desconhecido')
          );
        }
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setVerificandoDuplicatas(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Novo Pedido de Compra
          </h1>
          <GlossaryText>
            <p className='text-gray-600'>
              Descreva o que você quer comprar e anexe os documentos necessários.
              Este PC será avaliado conforme as regras de CAPEX/OPEX do seu CC e
              seguirá o SLA definido pelo OPA.
            </p>
          </GlossaryText>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do pedido</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <ValidatedField
                label="Título do Pedido"
                name="titulo"
                register={register}
                errors={errors}
                touchedFields={touchedFields}
                placeholder="Ex: Notebook para equipe de TI"
                description="Descreva brevemente o que está sendo solicitado"
              />

              <div className='grid grid-cols-2 gap-4'>
                <ValidatedField
                  label="Categoria"
                  name="categoria"
                  register={register}
                  errors={errors}
                  touchedFields={touchedFields}
                  description="Tipo de despesa para contabilização"
                >
                  <select
                    {...register('categoria')}
                    className={`
                      w-full px-3 py-2 border rounded-md shadow-sm
                      focus:outline-none focus:ring-2 transition-colors duration-200
                      ${errors.categoria
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : touchedFields.categoria && !errors.categoria
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                    `}
                  >
                    <option value=''>Selecione...</option>
                    <option value='OPEX'>OPEX</option>
                    <option value='CAPEX'>CAPEX</option>
                    <option value='TI'>TI</option>
                    <option value='MARKETING'>MARKETING</option>
                    <option value='RH'>RH</option>
                    <option value='FINANCEIRO'>FINANCEIRO</option>
                    <option value='OPERACIONAL'>OPERACIONAL</option>
                  </select>
                  {sugestaoCategoria && (
                    <div className='mt-2 p-2 bg-blue-50 rounded-md'>
                      <div className='flex items-center space-x-2'>
                        <CheckCircle className='w-4 h-4 text-blue-600' />
                        <span className='text-sm text-blue-800'>
                          IA sugere: {sugestaoCategoria}
                        </span>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setValue('categoria', sugestaoCategoria);
                            trigger('categoria'); // Re-validar campo
                          }}
                        >
                          Usar
                        </Button>
                      </div>
                    </div>
                  )}
                </ValidatedField>

                <ValidatedField
                  label="Centro de Custo"
                  name="cc"
                  register={register}
                  errors={errors}
                  touchedFields={touchedFields}
                  description="Área responsável pelo custo"
                >
                  <select
                    {...register('cc')}
                    className={`
                      w-full px-3 py-2 border rounded-md shadow-sm
                      focus:outline-none focus:ring-2 transition-colors duration-200
                      ${errors.cc
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : touchedFields.cc && !errors.cc
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                    `}
                  >
                    <option value=''>Selecione...</option>
                    <option value='ADM'>ADM</option>
                    <option value='TI'>TI</option>
                    <option value='MARKETING'>MARKETING</option>
                    <option value='RH'>RH</option>
                    <option value='FINANCEIRO'>FINANCEIRO</option>
                    <option value='OPERACIONAL'>OPERACIONAL</option>
                  </select>
                </ValidatedField>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <ValidatedField
                  label="Valor (R$)"
                  name="valor"
                  register={register}
                  errors={errors}
                  touchedFields={touchedFields}
                  placeholder="0,00"
                  description="Valor total da compra"
                >
                  <input
                    {...register('valor', { valueAsNumber: true })}
                    type='number'
                    step='0.01'
                    min='0'
                    className={`
                      w-full px-3 py-2 border rounded-md shadow-sm
                      focus:outline-none focus:ring-2 transition-colors duration-200
                      [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                      ${errors.valor
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : touchedFields.valor && !errors.valor
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                    `}
                    placeholder='0,00'
                  />
                </ValidatedField>

                <ValidatedField
                  label="Projeto (opcional)"
                  name="projeto"
                  register={register}
                  errors={errors}
                  touchedFields={touchedFields}
                  placeholder="Nome do projeto"
                  description="Projeto ao qual a compra está relacionada"
                />
              </div>

              <ValidatedField
                label="Descrição Detalhada"
                name="descricao"
                register={register}
                errors={errors}
                touchedFields={touchedFields}
                description="Descreva detalhadamente o que está sendo solicitado"
              >
                <textarea
                  {...register('descricao')}
                  rows={4}
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm
                    focus:outline-none focus:ring-2 transition-colors duration-200 resize-none
                    ${errors.descricao
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touchedFields.descricao && !errors.descricao
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }
                  `}
                  placeholder='Descreva detalhadamente o que está sendo solicitado, justificativa, especificações técnicas, etc.'
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Min: 10 caracteres</span>
                  <span>{watch('descricao')?.length || 0}/500</span>
                </div>
              </ValidatedField>
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>
                Adicione os documentos necessários (cotações, propostas, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <Paperclip className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-gray-600 mb-2'>
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <input
                  type='file'
                  multiple
                  onChange={handleFile}
                  className='hidden'
                  id='file-upload'
                />
                <label htmlFor='file-upload'>
                  <Button type='button' variant='outline' asChild>
                    <span>Selecionar Arquivos</span>
                  </Button>
                </label>
              </div>

              {files.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='font-medium'>Arquivos selecionados:</h4>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                    >
                      <div className='flex items-center space-x-3'>
                        <FileText className='w-5 h-5 text-gray-400' />
                        <div>
                          <div className='font-medium'>{file.name}</div>
                          <div className='text-sm text-gray-500'>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeFile(index)}
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {validacaoAnexos && (
                <div
                  className={`p-4 rounded-md ${
                    validacaoAnexos.valid ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className='flex items-center space-x-2'>
                    {validacaoAnexos.valid ? (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    ) : (
                      <AlertCircle className='w-5 h-5 text-red-600' />
                    )}
                    <span
                      className={`font-medium ${
                        validacaoAnexos.valid
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {validacaoAnexos.valid
                        ? 'Anexos OK!'
                        : 'Anexos incompletos'}
                    </span>
                  </div>
                  {!validacaoAnexos.valid && (
                    <div className='mt-2'>
                      <p className='text-sm text-red-700'>
                        Faltam: {validacaoAnexos.missing.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerta de Duplicatas */}
          {duplicatas.length > 0 && (
            <Card className='border-yellow-200 bg-yellow-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center space-x-2 mb-4'>
                  <AlertCircle className='w-5 h-5 text-yellow-600' />
                  <span className='font-medium text-yellow-800'>
                    Pedidos similares encontrados!
                  </span>
                </div>
                <div className='space-y-2'>
                  {duplicatas.map((duplicata, index) => (
                    <div
                      key={index}
                      className='p-3 bg-white rounded-md border border-yellow-200'
                    >
                      <div className='font-medium text-sm'>
                        {duplicata.titulo}
                      </div>
                      <div className='text-sm text-gray-600'>
                        {duplicata.categoria} • {duplicata.cc} • R${' '}
                        {duplicata.valor.toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Criado em:{' '}
                        {new Date(duplicata.criado_em).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 text-sm text-yellow-700'>
                  Verifique se não está criando um pedido duplicado. Se
                  necessário, continue mesmo assim.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className='flex justify-end space-x-4'>
            <Button type='button' variant='outline'>
              Salvar Rascunho
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || verificandoDuplicatas || !isValid}
              className={`
                transition-all duration-200
                ${!isValid
                  ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400'
                  : ''
                }
              `}
            >
              {verificandoDuplicatas ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verificando...
                </>
              ) : isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  {isValid ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Enviar Pedido
                </>
              )}
            </Button>
          </div>

          {/* Indicador de validação do formulário */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  Corrija os seguintes erros:
                </span>
              </div>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([field, error]: [string, any]) => (
                  <li key={field} className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
