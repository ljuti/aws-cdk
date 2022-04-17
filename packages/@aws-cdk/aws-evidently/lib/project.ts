import { Resource, IResource, Stack, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnProject } from './evidently.generated';

/**
 * An Evidently Project resource
 */
export interface IProject extends IResource {
  /**
   * The ARN of the project
   *
   * @attribute
   */
  readonly projectArn: string;

  /**
   * The name of the project
   *
   * @attribute
   */
  readonly projectName: string;
}

/**
 * A reference to an Evidently Project
 */
export interface ProjectAttributes {
  /**
   * The ARN of the project
   */
  readonly projectArn: string;
}

/**
 * Represents an Evidently Project
 */
abstract class ProjectBase extends Resource implements IProject {
  /**
   * The ARN of the project
   */
  public abstract readonly projectArn: string;

  /**
   * The name of the project
   */
  public abstract readonly projectName: string;
}

/**
 * Properties for an Evidently Project
 */
export interface ProjectProps {
  /**
   * The name for a project.
   *
   * @required true
   */
  readonly projectName: string;

  /**
   * A description of the project.
   *
   * @required false
   * @default -
   */
  readonly description?: string;

  /**
   * Data delivery
   *
   * @required false
   * @default -
   */
  readonly dataDelivery?: DataDeliveryObject;
}

/**
 * An Evidently Project.
 */
export class Project extends ProjectBase {
  /**
   * Import an existing Evidently Project from provided ARN.
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param projectArn Evidently Project ARN
   * @returns IProject
   */
  public static fromProjectArn(scope: Construct, id: string, projectArn: string): IProject {
    return Project.fromProjectAttributes(scope, id, {
      projectArn,
    });
  }

  /**
   * Creates an Evidently Project construct that represents an external project.
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param attrs Project import properties
   * @returns IProject
   */
  public static fromProjectAttributes(scope: Construct, id: string, attrs: ProjectAttributes): IProject {
    class ImportedProject extends ProjectBase {
      public readonly projectArn = attrs.projectArn;
      public readonly projectName = Stack.of(scope).splitArn(attrs.projectArn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!;
    }

    return new ImportedProject(scope, id);
  }

  public readonly projectArn: string;
  public readonly projectName: string;

  private readonly project: CfnProject;

  constructor(scope: Construct, id: string, props: ProjectProps) {
    super(scope, id, {
      physicalName: props.projectName,
    });

    const dataDelivery = props.dataDelivery;

    this.project = new CfnProject(this, 'Resource', {
      name: this.physicalName,
      description: props.description!,
      dataDelivery,
    });

    this.projectArn = this.getResourceArnAttribute(this.project.attrArn, {
      service: 'evidently',
      resource: 'project',
      resourceName: this.physicalName,
    });

    this.projectName = this.getResourceNameAttribute(this.project.ref);
  }
}

/**
 * An Amazon S3 bucket for the project to store evaluation events
 */
export interface S3Destination {
  /**
   * The name of the bucket in which Evidently stores evaluation events.
   *
   * @required false
   * @default -
   */
  readonly bucketName: string;

  /**
   * The bucket prefix in which Evidently stores evaluation events.
   *
   * @required false
   * @default -
   */
  readonly prefix?: string;
}

/**
 * Where Evidently is to store evaluation events of the project
 */
export interface DataDeliveryObject {
  /**
   * If the project stores evaluation events in CloudWatch Logs, this structure stores the log group name.
   *
   * @required false
   * @default -
   */
  readonly logGroup?: string;

  /**
   * If the project stores evaluation events in an Amazon S3 bucket, this structure stores the bucket name and bucket prefix.
   *
   * @required false
   * @default -
   * @returns S3Destination
   */
  readonly s3?: S3Destination;
}