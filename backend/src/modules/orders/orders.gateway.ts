import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Order, OrderStatus } from './entities/order.entity';

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: '*' },
})
export class OrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  // ---------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---------------------------------------------------------------
  // Subscriptions: clients join rooms for their user / store
  // ---------------------------------------------------------------

  /** Customer subscribes to their own order updates */
  @SubscribeMessage('subscribe:customer')
  handleCustomerSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { customerId: string },
  ): void {
    const room = `customer:${data.customerId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  /** Store subscribes to incoming order notifications */
  @SubscribeMessage('subscribe:store')
  handleStoreSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storeId: string },
  ): void {
    const room = `store:${data.storeId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  /** Subscribe to a specific order */
  @SubscribeMessage('subscribe:order')
  handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  // ---------------------------------------------------------------
  // Emitters (called from OrdersService)
  // ---------------------------------------------------------------

  /** Emit when a new order is created */
  notifyOrderCreated(order: Order): void {
    const payload = {
      event: 'order:created',
      orderNumber: order.orderNumber,
      orderId: order.id,
      status: order.status,
      total: order.total,
      storeId: order.storeId,
      customerId: order.customerId,
      createdAt: order.createdAt,
    };

    // Notify the store
    this.server
      .to(`store:${order.storeId}`)
      .emit('order:created', payload);

    // Notify the customer
    this.server
      .to(`customer:${order.customerId}`)
      .emit('order:created', payload);

    this.logger.log(`Emitted order:created for ${order.orderNumber}`);
  }

  /** Emit when order status changes */
  notifyStatusChange(
    order: Order,
    previousStatus: OrderStatus,
  ): void {
    const payload = {
      event: 'order:status_changed',
      orderNumber: order.orderNumber,
      orderId: order.id,
      previousStatus,
      newStatus: order.status,
      storeId: order.storeId,
      customerId: order.customerId,
      updatedAt: new Date().toISOString(),
    };

    // Notify all rooms related to this order
    this.server
      .to(`order:${order.id}`)
      .to(`store:${order.storeId}`)
      .to(`customer:${order.customerId}`)
      .emit('order:status_changed', payload);

    this.logger.log(
      `Emitted order:status_changed for ${order.orderNumber}: ${previousStatus} -> ${order.status}`,
    );
  }
}
