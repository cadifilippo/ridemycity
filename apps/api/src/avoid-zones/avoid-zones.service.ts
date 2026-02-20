import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getAdminDb } from '../auth/firebase-admin';

export interface StoredAvoidZone {
  id: string;
  coordinates: number[][];
}

@Injectable()
export class AvoidZonesService {
  private get db() {
    return getAdminDb();
  }

  async findByUser(uid: string): Promise<StoredAvoidZone[]> {
    const snapshot = await this.db
      .collection('avoidZones')
      .where('uid', '==', uid)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      coordinates: JSON.parse(doc.data().coordinates as string) as number[][],
    }));
  }

  async create(uid: string, coordinates: number[][]): Promise<StoredAvoidZone> {
    const ref = await this.db.collection('avoidZones').add({
      uid,
      coordinates: JSON.stringify(coordinates),
      createdAt: new Date(),
    });

    return { id: ref.id, coordinates };
  }

  async delete(uid: string, id: string): Promise<void> {
    const ref = this.db.collection('avoidZones').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException(`Avoid zone ${id} not found`);
    }
    if (doc.data()!.uid !== uid) {
      throw new ForbiddenException('You do not own this avoid zone');
    }

    await ref.delete();
  }
}
