import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({
  tableName: 'deliveries',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})
export class Delivery extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare customerName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare contact: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare origin: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare destination: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare lastKnownDelay: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare delivered: boolean;
}
