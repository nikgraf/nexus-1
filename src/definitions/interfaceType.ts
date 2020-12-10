import { assertValidName, GraphQLInterfaceTypeConfig } from 'graphql'
import { messages } from '../messages'
import {
  AbstractTypeResolver,
  FieldResolver,
  GetGen,
  InterfaceFieldsFor,
  ModificationType,
} from '../typegenTypeHelpers'
import { ArgsRecord } from './args'
import { OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'
import { AbstractTypes, NexusTypes, NonNullConfig, SourceTypingDef, withNexusSymbol } from './_types'

export type Implemented = GetGen<'interfaceNames'> | NexusInterfaceTypeDef<any>

export interface FieldModification<TypeName extends string, FieldName extends string> {
  type?: ModificationType<TypeName, FieldName>
  /** The description to annotate the GraphQL SDL */
  description?: string
  /** The resolve method we should be resolving the field with */
  resolve?: FieldResolver<TypeName, FieldName>
  /** You are allowed to add non-required args when modifying a field */
  args?: ArgsRecord
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLInterfaceTypeConfig<any, any>['extensions']
}

export interface FieldModificationDef<TypeName extends string, FieldName extends string>
  extends FieldModification<TypeName, FieldName> {
  field: FieldName
}

export type NexusInterfaceTypeConfig<TypeName extends string> = {
  name: TypeName

  // Really wanted to keep this here, but alas, it looks like there's some
  // issues around inferring the generic.
  // https://github.com/Microsoft/TypeScript/pull/29478
  // https://github.com/Microsoft/TypeScript/issues/10195
  //
  // resolveType: AbstractTypeResolver<TypeName>;

  definition(t: InterfaceDefinitionBlock<TypeName>): void
  /**
   * Configures the nullability for the type, check the documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration on nullability.
   */
  nonNullDefaults?: NonNullConfig
  /** The description to annotate the GraphQL SDL */
  description?: string | null
  /** Source type information for this type */
  sourceType?: SourceTypingDef
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLInterfaceTypeConfig<any, any>['extensions']
} & AbstractTypes.MaybeTypeDefConfigFieldResolveType<TypeName>

export interface InterfaceDefinitionBuilder<TypeName extends string> extends OutputDefinitionBuilder {
  // TODO(tim): Remove before 1.0
  setLegacyResolveType(fn: AbstractTypeResolver<TypeName>): void
  addInterfaces(toAdd: Implemented[]): void
  addModification(toAdd: FieldModificationDef<TypeName, any>): void
}

export class InterfaceDefinitionBlock<TypeName extends string> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: InterfaceDefinitionBuilder<TypeName>) {
    super(typeBuilder)
  }
  /** @param interfaceName */
  implements(...interfaceName: Array<Implemented>) {
    this.typeBuilder.addInterfaces(interfaceName)
  }
  /** Modifies a field added via an interface */
  modify<FieldName extends Extract<InterfaceFieldsFor<TypeName>, string>>(
    field: FieldName,
    modifications: FieldModification<TypeName, FieldName>
  ) {
    this.typeBuilder.addModification({ ...modifications, field })
  }

  /* istanbul ignore next */
  protected resolveType(fn: AbstractTypeResolver<TypeName>) {
    console.error(new Error(messages.removedResolveType(this.typeBuilder.typeName)))
    this.typeBuilder.setLegacyResolveType(fn)
  }
}

export class NexusInterfaceTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusInterfaceTypeConfig<TypeName>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusInterfaceTypeDef, NexusTypes.Interface)

/**
 * Defines a GraphQLInterfaceType
 *
 * @param config
 */
export function interfaceType<TypeName extends string>(config: NexusInterfaceTypeConfig<TypeName>) {
  return new NexusInterfaceTypeDef<TypeName>(config.name, config)
}
